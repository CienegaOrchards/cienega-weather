var logger     = require('./lib/logger');
var influx     = require('influx')({host:'localhost',database:'weather'});
var serialport = require('serialport');
var moment     = require('moment');
var _          = require('underscore');

serialport.list(function(err, ports)
{
    if(err)
    {
        console.error(err);
    }
    else
    {
        ports = ports.filter(function(port)
        {
            return port.manufacturer.match(/Prolific.Technology.Inc\./);
        });

        if(ports.length > 0)
        {
            var stationPort = ports[0];

            var stationStream = new serialport.SerialPort(stationPort.comName, {
                baudrate: 9600,
                parser: serialport.parsers.readline("\r\n"),
            });

            var state = 0;
            var header;
            var lines;

            stationStream.on('data', function(data)
            {
                data = data.replace(/^\>/,'');
                switch(state)
                {
                    case 0:
                        if(data === '?')
                        {
                            state++;
                            stationStream.write(moment().format('[:k]MMDDHHmmss'));
                        }
                        break;

                    case 1:
                        if(data === 'OK')
                        {
                            state++;
                            stationStream.write(':q');
                        }
                        break;

                    case 2:
                        var matches = data.match(/\s+([0-9]*) items of ([0-9]*)/);
                        if(matches)
                        {
                            var numLogged = parseInt(matches[1]);
                            var maxLogged = parseInt(matches[2]);
                            console.log('Will receive',numLogged,'of',maxLogged);

                            state++;
                            lines = [];
                            stationStream.write(':o');
                        }
                        break;

                    case 3:
                        if(header === undefined)
                        {
                            header = data.split(',');
                            console.log('Got header',header);
                        }
                        else if(data.match(/^D,/))
                        {
                            lines.push(_.object(header, data.split(',')));
                        }
                        else
                        {
                            // Got 'OK trailer'
                            console.log('Received',lines.length,'cached lines');
                            console.log(lines);
                            state++;
                            stationStream.write(':z');
                        }
                        break;

                    case 4:
                        if(data === 'OK')
                        {
                            console.log('Data cleared OK');
                            state++;
                            stationStream.write(':a');
                        }
                        break;

                    case 5:
                        if(data === 'OK')
                        {
                            console.log('Automatice reporting now on');
                        }
                        else if(data.match(/^D,/))
                        {
                            console.log('Received:',_.object(header, data.split(',')));
                        }
                        else
                        {
                            console.error('Unexpected:',data);
                        }
                }
            });

            stationStream.on('error', function(err)
            {
                console.error('Serial port error:',err);
            });

            stationStream.on('close', function()
            {
                console.log('Serial port closed');
            });

            stationStream.on('open', function()
            {
                stationStream.write(':\r\n');
            });
        }
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
