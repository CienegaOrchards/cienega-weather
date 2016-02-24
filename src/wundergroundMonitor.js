var logger        = require('./lib/logger');
var nconf         = require('nconf');
nconf.argv().env().file({ file: 'api-keys.json' });

var weather       = new (require('wundergroundnode'))(nconf.get('WUNDERGROUND:API_KEY'));

var _ = require('underscore');
var moment = require('moment');

const ACTIVE_PWS = nconf.get('WUNDERGROUND:PORTOLA_VALLEY_PWS');

weather.hourlyForecast().request(ACTIVE_PWS, function(err, resp)
{
    if(err)
    {
        console.error(err);
    }
    else
    {
        console.log(JSON.stringify(resp, null, 4));
    }
});
