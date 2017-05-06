'use strict';

const logger = require('@hughescr/logger').logger;
const nconf     = require('nconf');
nconf.argv()
     .env()
     .file({ file: 'api-keys.json' });

const promisify = require('es6-promisify');
const _         = require('underscore');
const moment    = require('moment-timezone');
moment.tz.setDefault('US/Pacific');
const json2csv  = promisify(require('json2csv'));

const AWS = require('aws-sdk');
AWS.config.update(
{
    accessKeyId:     nconf.get('AWS:ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('AWS:SECRET_ACCESS_KEY'),
    region:          nconf.get('AWS:DYNAMO_ENDPOINT'),
});
const dynamo = new AWS.DynamoDB();
const dynamoScan = promisify(dynamo.scan.bind(dynamo));

dynamoScan(
{
    TableName: 'weather_log',
})
.then(weather_data =>
{
    let results = _.chain(weather_data.Items)
    .map(result =>
    {
        const temp = parseFloat(result.current_temp.N);
        const forecast = parseFloat(result.forecast_temp.N);
        return {
            time:     moment.unix(parseInt(result.timestamp.N)),
            forecast: forecast,
            temp:     temp,
        };
    })
    .sortBy('time')
    .value();

    logger.info(`Earliest: ${results[0].time.format()}; Last: ${results[results.length - 1].time.format()}`);

    results = _.chain(results)
    .map(result =>
    {
        const myTime = result.time;
        const actual = _.find(results, r2 =>
        {
            const hourDiff = r2.time.diff(myTime, 'hours', true);
            if(hourDiff >= 0.4 && hourDiff <= 1.6) { return true; }
            return false;
        });

        if(actual)
        {
            result.actual = actual.temp;
            result.diff   = actual.temp - result.forecast;
        }

        return result;
    })
    .filter(r => (r.actual !== undefined))
    .map(r => { r.time = r.time._d; return r; })
    .groupBy('forecast')
    .mapObject(arr =>
    {
        const stats = _.chain(arr)
        .pluck('actual')
        .reduce((sum, x) =>
        {
            sum.n++;
            const delta = x - sum.mean;
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
.then(results =>
{
    logger.info(results);
    return process.exit(0);
})
.catch(err =>
{
    logger.error(err, err.stack);
    return process.exit(1);
});
