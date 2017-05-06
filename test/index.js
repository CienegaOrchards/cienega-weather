'use strict';

require('chai').should();

const main = require('../src/index.js');
const data = require('./data/weather-sample.json');
const moment = require('moment-timezone');
moment.tz.setDefault('US/Pacific');

describe('Check calculations for last noon', () =>
{
    const now = moment();
    if(now.hour() >= 12)
    {
        it('Afternoon is after noon', () =>
        {
            main.sinceLastNoon(now).should.equal(true); // Afternoon is since last noon
        });
        it('12 hours before afternoon is before noon', () =>
        {
            now.subtract(12, 'hours');
            main.sinceLastNoon(now).should.equal(false); // 12 hours before afternoon is before last noon
        });
    }
    else
    {
        it('Before noon is after previous noon', () =>
        {
            main.sinceLastNoon(now).should.equal(true); // Before noon is after *previous* noon
        });
        it('24 hours before morning is before previous noon', () =>
        {
            now.subtract(24, 'hours');
            main.sinceLastNoon(now).should.equal(false); // 24 hours before that was before *previous* noon
        });
    }
});

describe('Check trigger level', () =>
{
    it('should use defaults if setting not explicit', () =>
    {
        main.tempInDangerZone(main.reverseForecastAdjustment(31)).should.equal(true);
        main.tempInDangerZone(main.reverseForecastAdjustment(32)).should.equal(true);
        main.tempInDangerZone(main.reverseForecastAdjustment(33)).should.equal(false);
    });

    it('should respond to trigger level being set', () =>
    {
        main.setLowTriggerLevel(40);
        main.tempInDangerZone(main.reverseForecastAdjustment(39)).should.equal(true);
        main.tempInDangerZone(main.reverseForecastAdjustment(40)).should.equal(true);
        main.tempInDangerZone(main.reverseForecastAdjustment(41)).should.equal(false);
    });
});

describe('Check reset level', () =>
{
    it('should use defaults if setting not explicit', () =>
    {
        main.tempInSafeZone(main.reverseForecastAdjustment(35)).should.equal(true);
        main.tempInSafeZone(main.reverseForecastAdjustment(34)).should.equal(true);
        main.tempInSafeZone(main.reverseForecastAdjustment(33)).should.equal(false);
    });

    it('should respond to recovery level being set', () =>
    {
        main.setHighRecoveryLevel(40);
        main.tempInSafeZone(main.reverseForecastAdjustment(41)).should.equal(true);
        main.tempInSafeZone(main.reverseForecastAdjustment(40)).should.equal(true);
        main.tempInSafeZone(main.reverseForecastAdjustment(39)).should.equal(false);
    });
});

describe('Find lowest forecast temperature', () =>
{
    it('should correctly find lowest temp', () =>
    {
        const minForecast = main.lowestForecastTemp(data);
        minForecast.time.diff(moment('2016-02-24T06:00:00-08:00'), 'seconds', true).should.equal(0);
        minForecast.temp.should.equal(46);
        minForecast.feelslike.should.equal(46);
    });
});

describe('Check message creation', () =>
{
    it('should generate correct message when temps same', () =>
    {
        main.messageForForecast(
        {
            temp: main.reverseForecastAdjustment(32),
            feelslike: main.reverseForecastAdjustment(32),
            time: moment('2016-02-26T06:00:00-0800'),
        }).should.equal('Minimum forecast temp is 32ºF Friday at 6am');
    });

    it('should generate correct message when temps differ', () =>
    {
        main.messageForForecast(
        {
            temp: main.reverseForecastAdjustment(32),
            feelslike: main.reverseForecastAdjustment(30),
            time: moment('2016-02-26T06:00:00-0800'),
        }).should.equal('Minimum forecast temp is 32ºF (feels like 30) Friday at 6am');
    });
});

describe('Check when next noon is', () =>
{
    it('should calculate next noon correctly for various datetimes', () =>
    {
        main.findNextNoon(moment('20160101T11:59:59-0800')).diff(moment('20160101T12:00:00-0800'), 'seconds').should.equal(0);
        main.findNextNoon(moment('20160101T12:00:00-0800')).diff(moment('20160102T12:00:00-0800'), 'seconds').should.equal(0);
        main.findNextNoon(moment('20160101T00:00:00-0800')).diff(moment('20160101T12:00:00-0800'), 'seconds').should.equal(0);
        main.findNextNoon(moment('20160101T23:59:59-0800')).diff(moment('20160102T12:00:00-0800'), 'seconds').should.equal(0);
    });
});

describe('Need to send checks', () =>
{
    const _2PMToday = moment().hour(14).minute(0).seconds(0);
    const _8PMToday = moment().hour(20).minute(0).seconds(0);
    const _10PMToday = moment().hour(22).minute(0).seconds(0);
    const _11PMToday = moment().hour(23).minute(0).seconds(0);

    const _44HoursAgo = moment().subtract(44, 'hours');
    const _48HoursAgo = moment().subtract(48, 'hours');

    const coldForecast =
    {
        temp: 28,
        feelslike: 28,
        time: _10PMToday,
    };

    const warmForecast =
    {
        temp: 50,
        feelslike: 50,
        time: _10PMToday,
    };

    const coldEarlyForecast =
    {
        temp: 28,
        feelslike: 28,
        time: _8PMToday,
    };

    const colderForecast =
    {
        temp: 24,
        feelslike: 24,
        time: _10PMToday,
    };

    const colderForecastLater =
    {
        temp: 24,
        feelslike: 24,
        time: _11PMToday,
    };

    const sent2PMEarlier =
    {
        last_send_time: _2PMToday,
        last_send_temp: 28,
        last_send_forecast_time: _10PMToday,
    };

    const sentWarm2PMEarlier =
    {
        last_send_time: _2PMToday,
        last_send_temp: 50,
        last_send_forecast_time: _10PMToday,
    };

    const sent48HoursAgo =
    {
        last_send_time: _48HoursAgo,
        last_send_temp: 28,
        last_send_forecast_time: _44HoursAgo,
    };

    it('should send if tonight will be cold and last message a while back', () =>
    {
        const result = main.calculateNeedToSend(coldForecast, sent48HoursAgo);
        result.should.have.property('prefix');
        result.prefix.should.equal('FROST WARNING: ');
    });

    it('should send if tonight will be cold and last message recent and warm', () =>
    {
        const result = main.calculateNeedToSend(coldForecast, sentWarm2PMEarlier);
        result.should.have.property('prefix');
        result.prefix.should.equal('FROST WARNING: ');
    });

    it('should send if tonight will be cold earlier and last message recent', () =>
    {
        const result = main.calculateNeedToSend(coldEarlyForecast, sent2PMEarlier);
        result.should.have.property('prefix');
        result.prefix.should.equal('EARLIER: ');
    });

    it('should send if tonight will be colder and last message recent', () =>
    {
        const result = main.calculateNeedToSend(colderForecast, sent2PMEarlier);
        result.should.have.property('prefix');
        result.prefix.should.equal('COLDER: ');
    });

    it('should send if tonight will be colder later and last message recent', () =>
    {
        const result = main.calculateNeedToSend(colderForecastLater, sent2PMEarlier);
        result.should.have.property('prefix');
        result.prefix.should.equal('COLDER: ');
    });

    it('should send if tonight will be warm and last message recent and cold', () =>
    {
        const result = main.calculateNeedToSend(warmForecast, sent2PMEarlier);
        result.should.have.property('prefix');
        result.prefix.should.equal('NOW SAFE: ');
    });

    it('should not send if tonight will be cold but already sent', () =>
    {
        const result = main.calculateNeedToSend(coldForecast, sent2PMEarlier);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result
           .reason
           .match(/No need to send cos already sent on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) at [0-9]{1,2}[ap]m/)
           .should.not.equal(null);
    });

    it('should not send if tonight will be warm and sent long ago', () =>
    {
        const result = main.calculateNeedToSend(warmForecast, sent48HoursAgo);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result.reason.should.equal(`No need to send since temp is warm (50ºF/46ºF adjusted on ${warmForecast.time.format('dddd')} at ${warmForecast.time.format('ha')})`);
    });

    it('should not send if tonight will be warm and sent warm recently', () =>
    {
        const result = main.calculateNeedToSend(warmForecast, sentWarm2PMEarlier);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result.reason.should.equal(`No need to send since temp is warm (50ºF/46ºF adjusted on ${warmForecast.time.format('dddd')} at ${warmForecast.time.format('ha')})`);
    });

    it('should not send if tonight will be cold and sent cold recently', () =>
    {
        const result = main.calculateNeedToSend(coldForecast, sent2PMEarlier);
        result.should.not.have.property('prefix');
        result.should.have.property('nothing');
        result.nothing.should.equal(true);
        result.reason.should.equal(`No need to send cos already sent on ${sent2PMEarlier.last_send_time.format('dddd')} at ${sent2PMEarlier.last_send_time.format('ha')}`);
    });
});
