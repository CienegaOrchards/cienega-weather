'use strict';

require('./lib/logger');
var nconf     = require('nconf');
nconf.argv()
     .env()
     .file({ file: 'api-keys.json' });

var promisify = require('es6-promisify');
var _         = require('underscore');
var moment    = require('moment');

var weather       = new (require('wundergroundnode'))(nconf.get('WUNDERGROUND:API_KEY'));
var hourlyForecast = weather.hourlyForecast();
hourlyForecast = promisify(hourlyForecast.request.bind(hourlyForecast));
const ACTIVE_PWS = nconf.get('WUNDERGROUND:PORTOLA_VALLEY_PWS');

var twilio = require('twilio')(nconf.get('TWILIO:ACCOUNT_SID'), nconf.get('TWILIO:AUTH_TOKEN'));

var AWS = require('aws-sdk');
AWS.config.update(
{
    accessKeyId:     nconf.get('AWS:ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('AWS:SECRET_ACCESS_KEY'),
    region:          nconf.get('AWS:DYNAMO_ENDPOINT'),
});
var dynamo = new AWS.DynamoDB();
var dynamoGetItem = promisify(dynamo.getItem.bind(dynamo));
var dynamoUpdateItem = promisify(dynamo.updateItem.bind(dynamo));


function sentSometimeToday(when)
{
    return moment().diff(when, 'hours', true) <= 12;
}

function belowFreezing(forecast)
{
    return (forecast.feelslike !== undefined ? forecast.feelslike : forecast) <= 28;
}

function safeTemperature(forecast)
{
    return (forecast.feelslike !== undefined ? forecast.feelslike : forecast) >= 30;
}

exports.sendMinimumForecast = function(event, context)
{
    Promise.all(
    [
        hourlyForecast(ACTIVE_PWS),

        dynamoGetItem(
        {
            TableName: 'cienega_weather',
            Key:
            {
                doc_key:
                {
                    S: 'last_send_info',
                },
            },
        }),

        dynamoGetItem(
        {
            TableName: 'cienega_weather',
            Key:
            {
                doc_key:
                {
                    S: 'target_phone_numbers',
                },
            },
        }),
    ])
    .then(function(results)
    {
        var minForecast          = _.chain(results[0].hourly_forecast)
                                    .map(function(hour)
                                    {
                                        var timestamp = moment.unix(parseInt(hour.FCTTIME.epoch));
                                        var temp = parseInt(hour.temp.english);
                                        var feelslike = parseInt(hour.feelslike.english);

                                        return {
                                            time: timestamp,
                                            temp: temp,
                                            feelslike: feelslike,
                                        };
                                    })
                                    .filter(function(f)
                                    {
                                        return f.time.diff(moment(), 'hours', true) <= 18; // Only look ahead 18 hours
                                    })
                                    .min(function(f)
                                    {
                                        return f.feelslike; // Find the lowest forecast temperature
                                    })
                                    .value();
        var last_send_info       = _.mapObject(results[1].Item, function(val) { if(val.S) { return val.S; } if(val.N) { return parseInt(val.N); } });
        var target_phone_numbers = _.map(results[2].Item.phones.L, function(phone) { return phone.S; });

        var messageBody = `Minimum forecast temp is ${minForecast.temp}ºF `;
        if(minForecast.temp !== minForecast.feelslike)
        {
            messageBody += `(feels like ${minForecast.feelslike}) `;
        }
        messageBody += `${minForecast.time.format('dddd [at] ha')}`;

        var need_to_send = false;

        var last_send_time = moment.unix(last_send_info.last_send_time);
        var last_send_temp = last_send_info.last_send_temp;
        var last_send_forecast_time = moment.unix(last_send_info.last_send_forecast_time);

        if(belowFreezing(minForecast))
        {
            // Forecast is below freezing, so warn if we didn't already warn today
            if(!sentSometimeToday(last_send_time))
            {
                need_to_send = true;
                messageBody = `FROST WARNING: ${messageBody}`;
            }

            // We did already send today, so check if the forecast min time is SOONER and if so, warn
            else if(last_send_forecast_time.isAfter(minForecast.time))
            {
                need_to_send = true;
                messageBody = `EARLIER: ${messageBody}`;
            }

            // We did already send today, but check if forecast temp is colder
            else if(last_send_temp > minForecast.temp)
            {
                need_to_send = true;
                messageBody = `COLDER: ${messageBody}`;
            }
        }

        // If it's not below freezing now, check if it's now safe
        else if(safeTemperature(minForecast))
        {
            // Tonight will be safe; if we had sent a message before warning of low temp, we can now cancel
            if(sentSometimeToday(last_send_time) && belowFreezing(last_send_temp))
            {
                need_to_send = true;
                messageBody = `NOW SAFE: ${messageBody}`;
            }
        }

        if(!need_to_send)
        {
            if(sentSometimeToday(last_send_time))
            {
                return { nothing: true, reason: `No need to send cos already sent at ${last_send_time.format()}` };
            }

            return { nothing: true, reason: `No need to send since temp is warm (${minForecast.feelslike}ºF)` };
        }

        // Save details of send

        return Promise.all(
        _.flatten([
            dynamoUpdateItem(
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
                            N: minForecast.temp.toString(),
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
                            N: minForecast.time.unix().toString(),
                        },
                    },
                    last_send_message:
                    {
                        Action: 'PUT',
                        Value:
                        {
                            S: messageBody,
                        },
                    },
                },
            }),

            _.map(target_phone_numbers, function(num)
            {
                console.log('Sending to', num);
                return twilio.messages.create(
                {
                    to: num,
                    from: nconf.get('TWILIO:SENDING_NUMBER'),
                    body: messageBody,
                });
            }),
        ]));
    })
    .then(function()
    {
        context.succeed('Sent!');
    })
    .catch(function(err)
    {
        context.fail(err);
    });
};
