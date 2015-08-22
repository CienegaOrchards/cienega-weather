var influx = require('influx')({host:'localhost',database:'weather'});
var router = require('express').Router();

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

router.get('/', function(req, res, next)
{
    res.render('index', { title: 'Express' });
});

module.exports = router;
