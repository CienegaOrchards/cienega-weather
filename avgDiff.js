'use strict';

require('./lib/logger');
var nconf     = require('nconf');
nconf.argv()
     .env()
     .file({ file: 'api-keys.json' });

var promisify = require('es6-promisify');
var _         = require('underscore');
var moment    = require('moment-timezone');
moment.tz.setDefault('US/Pacific');
var json2csv  = promisify(require('json2csv'));

var AWS = require('aws-sdk');
AWS.config.update(
{
    accessKeyId:     nconf.get('AWS:ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('AWS:SECRET_ACCESS_KEY'),
    region:          nconf.get('AWS:DYNAMO_ENDPOINT'),
});
var dynamo = new AWS.DynamoDB();
var dynamoScan = promisify(dynamo.scan.bind(dynamo));

dynamoScan(
{
    TableName: 'weather_log',
})
.then(function(results)
{
    results = _.chain(results.Items)
    .map(function(result)
    {
        let temp = parseFloat(result.current_temp.N);
        let forecast = parseFloat(result.forecast_temp.N);
        return {
            time:     parseInt(result.timestamp.N),
            forecast: forecast,
            temp:     temp,
        };
    })
    .sortBy('time')
    .value();

    console.log(`Earliest: ${moment.unix(results[0].time).format()}; Last: ${moment.unix(results[results.length - 1].time).format()}`);

    results = _.chain(results)
    .map(function(result)
    {
        let myTime = moment.unix(result.time);
        let actual = _.chain(results)
        .find(function(r2)
        {
            var hourDiff = moment.unix(r2.time).diff(myTime, 'hours', true);
            if(hourDiff >= 0.4 && hourDiff <= 1.6) { return true; }
            return false;
        })
        .value();

        if(actual)
        {
            result.actual = actual.temp;
            result.diff   = actual.temp - result.forecast;
        }

        return result;
    })
    .filter(function(r) { return r.actual !== undefined; })
    .groupBy('forecast')
    .mapObject(function(arr)
    {
        let stats = _.chain(arr)
        .pluck('actual')
        .reduce(function(sum, x)
        {
            sum.n++;
            let delta = x - sum.mean;
            sum.mean += delta / sum.n;
            sum.M2 += delta * (x - sum.mean);

            return sum;
        }, { n: 0, mean: 0, M2: 0 })
        .value();

        return [stats.mean, Math.sqrt(stats.M2 / (stats.n - 1)) || 0];
    })
    .pairs()
    .map(_.flatten)
    .value();

    return json2csv({ data: results });
})
.then(function(results)
{
    console.log(results);
    process.exit(0);
})
.catch(function(err)
{
    console.error(err, err.stack);
    process.exit(1);
});
