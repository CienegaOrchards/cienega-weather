'use strict';

const logger           = require('@hughescr/logger').logger;
const nconf            = require('nconf');
nconf.argv()
     .env()
     .file({ file: 'api-keys.json' });

const promisify        = require('es6-promisify');
const _                = require('underscore');
const moment           = require('moment-timezone');
moment.tz.setDefault('US/Pacific');

const weather          = new (require('wundergroundnode'))(nconf.get('WUNDERGROUND:API_KEY'));
const hourlyForecast   = promisify(weather.conditions().hourlyForecast().request.bind(weather));

const ACTIVE_PWS       = nconf.get('WUNDERGROUND:RANCH_PWS');

const twilio           = require('twilio')(nconf.get('TWILIO:ACCOUNT_SID'), nconf.get('TWILIO:AUTH_TOKEN'));

const AWS              = require('aws-sdk');
AWS.config.update(
{
    accessKeyId:     nconf.get('AWS:ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('AWS:SECRET_ACCESS_KEY'),
    region:          nconf.get('AWS:DYNAMO_ENDPOINT'),
});
const dynamo           = new AWS.DynamoDB();
const dynamoGetItem    = promisify(dynamo.getItem.bind(dynamo));
const dynamoUpdateItem = promisify(dynamo.updateItem.bind(dynamo));
const dynamoPutItem    = promisify(dynamo.putItem.bind(dynamo));

const shortid          = require('shortid');

exports.adjustForecast = function(forecast_temp)
{
    return Math.round(71.294 * Math.log(forecast_temp) - 229.79);
};

exports.reverseForecastAdjustment = function(adjusted_temp)
{
    return Math.exp((adjusted_temp + 229.79) / 71.294);
};

exports.sinceLastNoon = function(when)
{
    const todayNoon = moment().startOf('day').add(12, 'hours');
    if(moment().isAfter(todayNoon))
    {
        return when.isAfter(todayNoon);
    }
    else
    {
        const noonYesterday = moment().startOf('day').subtract(12, 'hours');
        return when.isAfter(noonYesterday);
    }
};

let lowTriggerLevel = 32;
exports.setLowTriggerLevel = function(temp)
{
    lowTriggerLevel = temp;
};
exports.tempInDangerZone = function(forecast)
{
    return (forecast.feelslike !== undefined ? exports.adjustForecast(forecast.feelslike) : exports.adjustForecast(forecast)) <= lowTriggerLevel;
};

let highRecoveryLevel = 34;
exports.setHighRecoveryLevel = function(temp)
{
    highRecoveryLevel = temp;
};
exports.tempInSafeZone = function(forecast)
{
    return (forecast.feelslike !== undefined ? exports.adjustForecast(forecast.feelslike) : exports.adjustForecast(forecast)) >= highRecoveryLevel;
};

exports.lowestForecastTemp = function(data)
{
    return _.chain(data.hourly_forecast) // Process the hourly_forecast data
            .map(hour =>          // Extract just the time (as moment object), temp (fahrenheit), and feelslike (fahrenheit) for each hour
            {
                const timestamp = moment.unix(parseInt(hour.FCTTIME.epoch));
                const temp = parseInt(hour.temp.english);
                const feelslike = parseInt(hour.feelslike.english);

                return {
                    time: timestamp,
                    temp: temp,
                    feelslike: feelslike,
                };
            })
            .min(f => parseFloat(f.feelslike + f.time.format('.x'))) // Find the lowest forecast feelslike and secondary sort by date
            .value();
};

exports.messageForForecast = function(forecast)
{
    let msg = `Minimum forecast temp is ${exports.adjustForecast(forecast.temp)}ºF `;
    if(forecast.temp !== forecast.feelslike)
    {
        msg += `(feels like ${exports.adjustForecast(forecast.feelslike)}) `;
    }
    msg += `${forecast.time.format('dddd [at] ha')}`;

    return msg;
};

exports.calculateNeedToSend = function(forecast, last_send_info)
{
    if(this.tempInDangerZone(forecast))
    {
        // Forecast is below freezing, so warn if we didn't already warn today or if last message was SAFE
        if(!this.sinceLastNoon(last_send_info.last_send_time) || this.tempInSafeZone(last_send_info.last_send_temp))
        {
            return { prefix: 'FROST WARNING: ' };
        }

        // Check if the forecast min time is SOONER and if so, warn
        if(last_send_info.last_send_forecast_time.isAfter(forecast.time))
        {
            return { prefix: 'EARLIER: ' };
        }

        // Check if forecast temp is colder than previous warning, and if so, warn
        if(last_send_info.last_send_temp > forecast.feelslike)
        {
            return { prefix: 'COLDER: ' };
        }
    }

    // If it's not below freezing now, check if it's now safe
    if(this.tempInSafeZone(forecast))
    {
        // Tonight will be safe; if we had sent a message before warning of low temp, we can now cancel
        if(this.sinceLastNoon(last_send_info.last_send_time) && this.tempInDangerZone(last_send_info.last_send_temp))
        {
            return { prefix: 'NOW SAFE: ' };
        }
    }

    if(!this.tempInSafeZone(last_send_info.last_send_temp) && this.sinceLastNoon(last_send_info.last_send_time))
    {
        return { nothing: true, reason: `No need to send cos already sent on ${last_send_info.last_send_time.format('dddd [at] ha')}` };
    }

    return { nothing: true, reason: `No need to send since temp is warm (${forecast.feelslike}ºF/${exports.adjustForecast(forecast.feelslike)}ºF adjusted on ${forecast.time.format('dddd [at] ha')})` };
};

function getLastSendInfo()
{
    return dynamoGetItem(
    {
        TableName: 'cienega_weather',
        Key:
        {
            doc_key:
            {
                S: 'last_send_info',
            },
        },
    });
}

function getTargetPhoneNumbers()
{
    return dynamoGetItem(
    {
        TableName: 'cienega_weather',
        Key:
        {
            doc_key:
            {
                S: 'target_phone_numbers',
            },
        },
    });
}

function getTempThresholds()
{
    return dynamoGetItem(
    {
        TableName: 'cienega_weather',
        Key:
        {
            doc_key:
            {
                S: 'threshold_temperatures',
            },
        },
    });
}

function saveLastSendInfo(forecast, message)
{
    return dynamoUpdateItem(
    {
        TableName: 'cienega_weather',
        Key:
        {
            doc_key:
            {
                S: 'last_send_info',
            },
        },
        AttributeUpdates:
        {
            last_send_temp:
            {
                Action: 'PUT',
                Value:
                {
                    N: forecast.temp.toString(),
                },
            },
            last_send_time:
            {
                Action: 'PUT',
                Value:
                {
                    N: moment().unix().toString(),
                },
            },
            last_send_forecast_time:
            {
                Action: 'PUT',
                Value:
                {
                    N: forecast.time.unix().toString(),
                },
            },
            last_send_message:
            {
                Action: 'PUT',
                Value:
                {
                    S: message,
                },
            },
        },
    });
}

function saveTemperaturesToLog(current, forecast)
{
    return dynamoPutItem(
    {
        TableName: 'weather_log',
        Item:
        {
            _id:
            {
                S: shortid.generate(),
            },
            timestamp:
            {
                N: moment().unix().toString(),
            },
            timestring:
            {
                S: moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ'),
            },
            current_temp:
            {
                N: current.temp.toString(),
            },
            forecast_temp:
            {
                N: forecast.temp.english.toString(),
            },
            adjusted_estimate:
            {
                N: forecast.adjusted_estimate.toString(),
            },
        },
    });
}

exports.findNextNoon = function(time)
{
    const nextNoon = time.clone();
    if(nextNoon.hour() >= 12)
    {
        nextNoon.endOf('day').add(12, 'hours');
    }
    else
    {
        nextNoon.startOf('day').add(12, 'hours');
    }

    return nextNoon;
};

exports.sendMinimumForecast = function(event, context, callback)
{
    Promise.all(
    [
        getLastSendInfo(),

        getTargetPhoneNumbers(),

        getTempThresholds(),

        hourlyForecast(ACTIVE_PWS),
    ])
    .then(results =>
    {
        const last_send_info          = _.mapObject(results[0].Item, val => { if(val.S) { return val.S; } if(val.N) { return parseInt(val.N); } });
        last_send_info.last_send_time          = moment.unix(last_send_info.last_send_time);
        last_send_info.last_send_forecast_time = moment.unix(last_send_info.last_send_forecast_time);

        const target_phone_numbers    = _.map(results[1].Item.phones.L, phone => phone.S);

        const threshold_temperatures  = _.mapObject(results[2].Item, val => { if(val.N) { return parseInt(val.N); } });
        exports.setLowTriggerLevel(threshold_temperatures.lowTriggerLevel);
        exports.setHighRecoveryLevel(threshold_temperatures.highRecoveryLevel);

        const forecast = results[3];
        const nextNoon = exports.findNextNoon(moment()); // Get forecasts through the next time it's noon
        forecast.hourly_forecast = _.filter(forecast.hourly_forecast, d => moment.unix(parseInt(d.FCTTIME.epoch)).isBefore(nextNoon));
        const minForecast        = exports.lowestForecastTemp(forecast);
        let messageBody          = exports.messageForForecast(minForecast);

        const current =
        {
            temp:      forecast.current_observation.temp_f,
            feelslike: parseFloat(forecast.current_observation.feelslike_f),
        };
        // This formula below is estimate correction based on observations from 2016-02-28 through 2016-03-29 using avgDiff.js
        forecast.hourly_forecast[0].adjusted_estimate = exports.adjustForecast(forecast.hourly_forecast[0].temp.english);
        logger.info(`Cur: ${current.temp} (${current.feelslike}); Forecast next hour: ${forecast.hourly_forecast[0].temp.english} (${forecast.hourly_forecast[0].feelslike.english}); Adjusted: ${forecast.hourly_forecast[0].adjusted_estimate}`);

        const needToSend = exports.calculateNeedToSend(minForecast, last_send_info);
        if(needToSend.nothing)
        {
            return Promise.all([
                needToSend,

                saveTemperaturesToLog(current, forecast.hourly_forecast[0]),
            ]);
        }

        // Prepend any prefix onto the message
        messageBody = `${needToSend.prefix} ${messageBody}`;

        return Promise.all(
        _.flatten(
        [
            saveLastSendInfo(minForecast, messageBody),

            saveTemperaturesToLog(current, forecast.hourly_forecast[0]),

            _.map(target_phone_numbers, num =>
            {
                logger.info('Sending to', num, ':', messageBody);
                return twilio.messages.create(
                {
                    to: num,
                    from: nconf.get('TWILIO:SENDING_NUMBER'),
                    body: messageBody,
                });
            }),
        ]));
    })
    .then(result =>
    {
        if(result[0].nothing)
        {
            logger.info(result[0].reason);
            return callback(null, result[0].reason);
        }

        logger.info(result[2].body);
        return callback(null, result[2].body);
    })
    .catch(err =>
    {
        logger.error(err);
        return callback(err);
    });
};
