require('chai').should();

var main = require('../wundergroundMonitor.js');
var data = require('./data/weather-sample.json');
var moment = require('moment-timezone');
moment.tz.setDefault('US/Pacific');

describe('Check calculations for last noon', function()
{
    var now = moment();
    if(now.hour() >= 12)
    {
        it('Afternoon is after noon', function()
        {
            main.sinceLastNoon(now).should.equal(true); // Afternoon is since last noon
        });
        it('12 hours before afternoon is before noon', function()
        {
            now.subtract(12, 'hours');
            main.sinceLastNoon(now).should.equal(false); // 12 hours before afternoon is before last noon
        });
    }
    else
    {
        it('Before noon is after previous noon', function()
        {
            main.sinceLastNoon(now).should.equal(true); // Before noon is after *previous* noon
        });
        it('24 hours before morning is before previous noon', function()
        {
            now.subtract(24, 'hours');
            main.sinceLastNoon(now).should.equal(false); // 24 hours before that was before *previous* noon
        });
    }
});

describe('Check trigger level', function()
{
    it('should use defaults if setting not explicit', function()
    {
        main.tempInDangerZone({ feelslike: main.reverseForecastAdjustment(31) }).should.equal(true);
        main.tempInDangerZone({ feelslike: main.reverseForecastAdjustment(32) }).should.equal(true);
        main.tempInDangerZone({ feelslike: main.reverseForecastAdjustment(33) }).should.equal(false);
    });

    it('should work with temp not wrapped in object', function()
    {
        main.tempInDangerZone(main.reverseForecastAdjustment(31)).should.equal(true);
        main.tempInDangerZone(main.reverseForecastAdjustment(33)).should.equal(false);
    });

    it('should respond to trigger level being set', function()
    {
        main.setLowTriggerLevel(40);
        main.tempInDangerZone({ feelslike: main.reverseForecastAdjustment(39) }).should.equal(true);
        main.tempInDangerZone({ feelslike: main.reverseForecastAdjustment(40) }).should.equal(true);
        main.tempInDangerZone({ feelslike: main.reverseForecastAdjustment(41) }).should.equal(false);
    });
});

describe('Check reset level', function()
{
    it('should use defaults if setting not explicit', function()
    {
        main.tempInSafeZone({ feelslike: main.reverseForecastAdjustment(35) }).should.equal(true);
        main.tempInSafeZone({ feelslike: main.reverseForecastAdjustment(34) }).should.equal(true);
        main.tempInSafeZone({ feelslike: main.reverseForecastAdjustment(33) }).should.equal(false);
    });

    it('should work with temp not wrapped in object', function()
    {
        main.tempInSafeZone(main.reverseForecastAdjustment(35)).should.equal(true);
        main.tempInSafeZone(main.reverseForecastAdjustment(33)).should.equal(false);
    });

    it('should respond to recovery level being set', function()
    {
        main.setHighRecoveryLevel(40);
        main.tempInSafeZone({ feelslike: main.reverseForecastAdjustment(41) }).should.equal(true);
        main.tempInSafeZone({ feelslike: main.reverseForecastAdjustment(40) }).should.equal(true);
        main.tempInSafeZone({ feelslike: main.reverseForecastAdjustment(39) }).should.equal(false);
    });
});

describe('Find lowest forecast temperature', function()
{
    it('should correctly find lowest temp', function()
    {
        var minForecast = main.lowestForecastTemp(data);
        minForecast.time.diff(moment('2016-02-24T06:00:00-08:00'), 'seconds', true).should.equal(0);
        minForecast.temp.should.equal(46);
        minForecast.feelslike.should.equal(46);
    });
});

describe('Check message creation', function()
{
    it('should generate correct message when temps same', function()
    {
        main.messageForForecast(
        {
            temp: main.reverseForecastAdjustment(32),
            feelslike: main.reverseForecastAdjustment(32),
            time: moment('2016-02-26T06:00:00-0800'),
        }).should.equal('Minimum forecast temp is 32ºF Friday at 6am');
    });

    it('should generate correct message when temps differ', function()
    {
        main.messageForForecast(
        {
            temp: main.reverseForecastAdjustment(32),
            feelslike: main.reverseForecastAdjustment(30),
            time: moment('2016-02-26T06:00:00-0800'),
        }).should.equal('Minimum forecast temp is 32ºF (feels like 30) Friday at 6am');
    });
});

describe('Check when next noon is', function()
{
    it('should calculate next noon correctly for various datetimes', function()
    {
        main.findNextNoon(moment('20160101T11:59:59-0800')).diff(moment('20160101T12:00:00-0800'), 'seconds').should.equal(0);
        main.findNextNoon(moment('20160101T12:00:00-0800')).diff(moment('20160102T12:00:00-0800'), 'seconds').should.equal(0);
        main.findNextNoon(moment('20160101T00:00:00-0800')).diff(moment('20160101T12:00:00-0800'), 'seconds').should.equal(0);
        main.findNextNoon(moment('20160101T23:59:59-0800')).diff(moment('20160102T12:00:00-0800'), 'seconds').should.equal(0);
    });
});

describe('Need to send checks', function()
{
    var _4HoursAgo = moment().subtract(4, 'hours');
    var _4HoursHence = moment().add(4, 'hours');
    var _6HoursHence = moment().add(6, 'hours');
    var _44HoursAgo = moment().subtract(44, 'hours');
    var _48HoursAgo = moment().subtract(48, 'hours');
    var _2HoursHence = moment().add(2, 'hours');

    var coldForecast =
    {
        temp: 28,
        feelslike: 28,
        time: _4HoursHence,
    };

    var warmForecast =
    {
        temp: 50,
        feelslike: 50,
        time: _4HoursHence,
    };

    var coldEarlyForecast =
    {
        temp: 28,
        feelslike: 28,
        time: _2HoursHence,
    };

    var colderForecast =
    {
        temp: 24,
        feelslike: 24,
        time: _4HoursHence,
    };

    var colderForecastLater =
    {
        temp: 24,
        feelslike: 24,
        time: _6HoursHence,
    };

    var sent4HoursAgo =
    {
        last_send_time: _4HoursAgo,
        last_send_temp: 28,
        last_send_forecast_time: _4HoursHence,
    };

    var sentWarm4HoursAgo =
    {
        last_send_time: _4HoursAgo,
        last_send_temp: 50,
        last_send_forecast_time: _4HoursHence,
    };

    var sent48HoursAgo =
    {
        last_send_time: _48HoursAgo,
        last_send_temp: 28,
        last_send_forecast_time: _44HoursAgo,
    };

    it('should send if tonight will be cold and last message a while back', function()
    {
        var result = main.calculateNeedToSend(coldForecast, sent48HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('FROST WARNING: ');
    });

    it('should send if tonight will be cold and last message recent and warm', function()
    {
        var result = main.calculateNeedToSend(coldForecast, sentWarm4HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('FROST WARNING: ');
    });

    it('should send if tonight will be cold earlier and last message recent', function()
    {
        var result = main.calculateNeedToSend(coldEarlyForecast, sent4HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('EARLIER: ');
    });

    it('should send if tonight will be colder and last message recent', function()
    {
        var result = main.calculateNeedToSend(colderForecast, sent4HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('COLDER: ');
    });

    it('should send if tonight will be colder later and last message recent', function()
    {
        var result = main.calculateNeedToSend(colderForecastLater, sent4HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('COLDER: ');
    });

    it('should send if tonight will be warm and last message recent and cold', function()
    {
        var result = main.calculateNeedToSend(warmForecast, sent4HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('NOW SAFE: ');
    });

    it('should not send if tonight will be cold but already sent', function()
    {
        var result = main.calculateNeedToSend(coldForecast, sent4HoursAgo);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result
           .reason
           .match(/No need to send cos already sent on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) at [0-9]{1,2}[ap]m/)
           .should.not.equal(null);
    });

    it('should not send if tonight will be warm and sent long ago', function()
    {
        var result = main.calculateNeedToSend(warmForecast, sent48HoursAgo);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result.reason.should.equal(`No need to send since temp is warm (50ºF/49ºF adjusted on ${warmForecast.time.format('dddd')} at ${warmForecast.time.format('ha')})`);
    });

    it('should not send if tonight will be warm and sent warm recently', function()
    {
        var result = main.calculateNeedToSend(warmForecast, sentWarm4HoursAgo);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result.reason.should.equal(`No need to send since temp is warm (50ºF/49ºF adjusted on ${warmForecast.time.format('dddd')} at ${warmForecast.time.format('ha')})`);
    });

    it('should not send if tonight will be cold and sent cold recently', function()
    {
        var result = main.calculateNeedToSend(coldForecast, sent4HoursAgo);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result.reason.should.equal(`No need to send cos already sent on ${sent4HoursAgo.last_send_time.format('dddd')} at ${sent4HoursAgo.last_send_time.format('ha')}`);
    });
});
