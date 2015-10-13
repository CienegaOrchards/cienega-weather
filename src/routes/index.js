var influx    = require('influx')({host:'weather-pi.rungie.com',database:'weather'});
var router    = require('express').Router();
var moment    = require('moment');
var promisify = require('es6-promisify');
var Lazy      = require('lazy.js');

var influxQuery = promisify(influx.query.bind(influx));

router.get('/', function(req, res, next)
{
    res.render('index', { title: 'Express' });
});

router.get('/weather_data', function(req, res, next)
{
    var maxDate = moment('2015-04-01');
    var minDate = moment(maxDate).subtract(30, 'days');

    var query = 'select min(CHILL) as temp_low, percentile(CHILL,40) as temp_lowmid, median(CHILL) as temp_mid, percentile(CHILL,60) as temp_highmid, max(CHILL) as temp_high,'+
                       'min(HUM)    as hum_low, percentile(HUM,40)    as hum_lowmid, median(HUM)   as hum_mid,  percentile(HUM,60)   as hum_highmid,  max(HUM)   as hum_high,'+
                       'min(BARO)  as baro_low, percentile(BARO,40)  as baro_lowmid, median(BARO)  as baro_mid, percentile(BARO,60)  as baro_highmid, max(BARO)  as baro_high'+
                    ' from station where time > \''+minDate.format('YYYY-MM-DD HH:mm:ss')+'\' and time < \''+maxDate.format('YYYY-MM-DD HH:mm:ss')+
                    '\' group by time(1d) fill(none)';
    console.log('Query:',query);
    influxQuery(query)
    .then(function(results)
    {
        res.status(200).json({
            from: minDate._d,
            to:   maxDate._d,
            data: results[0].sort(function(a,b){ return a.time.localeCompare(b.time); })
        });
    })
    .then(undefined, function(err)
    {
        console.error('Error:',err.stack);
        res.status(500).json({error: err.stack});
    });
});

module.exports = router;
