var router = require('express').Router();

module.exports = function(serialport, influx, weather, twilio)
{
    serialport.list(function(err, ports)
    {
        if(err)
        {
            console.error(err);
        }
        else
        {
            ports.forEach(function(port)
            {
                console.log(port);
            });
        }
    });

    // var stationPort = new serialport.SerialPort('/dev/ttyUSB0', {
    //     baudrate: 9600,
    //     parser: serialport.parsers.readline("\n"),
    // }, function(err)
    // {
    //     if(err)
    //     {
    //         console.error(err);
    //     }
    //     else
    //     {
    //         console.log('open');

    //         stationPort.on('error', function(err)
    //         {
    //             console.error('Serial port error:',err);
    //         });

    //         stationPort.on('data', function(data)
    //         {
    //             console.log('Serial data received:',data);
    //         });

    //         stationPort.on('close', function()
    //         {
    //             console.log('Serial port closed');
    //         });

    //         stationPort.write("ls\n");
    //     }
    // });

    // weather.hourlyForecast().request('pws:KCAHOLLI23', function(err, resp)
    // {
    //     if(err)
    //     {
    //         console.error(err);
    //     }
    //     else
    //     {
    //         console.log(JSON.stringify(resp,null,4));
    //     }
    // });

    // influx.getDatabaseNames(function(err,dbnames)
    // {
    //     if(err)
    //     {
    //         console.error(err);
    //     }
    //     else
    //     {
    //         dbnames.forEach(function(name)
    //         {
    //             console.log("Database:",name);
    //         });
    //     }
    // });

    // twilio.messages.create({
    //     to: "+16508514450",
    //     from: "+16503326710",
    //     body: "Hi there!  This is a test!",
    // })
    // .then(function(message)
    // {
    //     console.log(message);
    // })
    // .then(null, function(err)
    // {
    //     console.error(err);
    // });

    /* GET home page. */
    router.get('/', function(req, res, next)
    {
      res.render('index', { title: 'Express' });
    });

    return router;
};
