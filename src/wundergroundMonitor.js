var logger        = require('./lib/logger');
var nconf         = require('nconf');
nconf.argv().env().file({ file: 'api-keys.json' });

var weather       = new (require('wundergroundnode'))(nconf.get('WUNDERGROUND:API_KEY'));

weather.hourlyForecast().request('pws:KCAHOLLI23', function(err, resp)
{
    if(err)
    {
        console.error(err);
    }
    else
    {
        console.log(JSON.stringify(resp,null,4));
    }
});
