var logger     = require('./lib/logger');
var influx     = require('influx')({host:'localhost',database:'weather'});
var serialport = require('serialport');

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
