"use strict";

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

exports.sendMinimumForecast = function(event, context)
{
    hourlyForecast(ACTIVE_PWS)
    .then(function(resp)
    {
        var forecast = resp.hourly_forecast;

        forecast = _.map(forecast, function(hour)
        {
            var timestamp = moment.unix(parseInt(hour.FCTTIME.epoch));
            var temp = parseInt(hour.temp.english);
            var feelslike = parseInt(hour.feelslike.english);

            return {
                time: timestamp,
                temp: temp,
                feelslike: feelslike,
            };
        });

        var minForecast = _.min(forecast, function(f)
        {
            return f.feelslike;
        });

        var messageBody = `Minimum forecast temp is ${minForecast.temp}ºF `;
        if(minForecast.temp !== minForecast.feelslike)
        {
            messageBody += `(feels like ${minForecast.feelslike}) `;
        }
        messageBody += `${minForecast.time.format('dddd [at] ha')}`;

        return twilio.messages.create({
            to: '+16508514450',
            from: nconf.get('TWILIO:SENDING_NUMBER'),
            body: messageBody,
        });
    })
    .then(context.done.bind(context));
};
