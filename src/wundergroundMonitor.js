var logger        = require('./lib/logger');
var weather       = new (require('wundergroundnode'))('***REMOVED***');

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
