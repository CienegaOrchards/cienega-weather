var router = require('express').Router();

module.exports = function(influx, weather, twilio)
{
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

    influx.getDatabaseNames(function(err,dbnames)
    {
        if(err)
        {
            console.error(err);
        }
        else
        {
            dbnames.forEach(function(name)
            {
                console.log("Database:",name);
            });
        }
    });

    twilio.messages.create({
        to: "+16508514450",
        from: "+16503326710",
        body: "Hi there!  This is a test!",
    })
    .then(function(message)
    {
        console.log(message);
    })
    .then(null, function(err)
    {
        console.error(err);
    });

    /* GET home page. */
    router.get('/', function(req, res, next)
    {
      res.render('index', { title: 'Express' });
    });

    return router;
};
