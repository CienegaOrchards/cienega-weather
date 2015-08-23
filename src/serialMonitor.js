var logger     = require('./lib/logger');
var influx     = require('influx')({host:'localhost',database:'weather'});
var serialport = require('serialport');
var moment     = require('moment');
var _          = require('underscore');

function parseWeatherLine(header, data)
{
    if(header.length !== data.length)
    {
        console.error('Mismatch in length: header == ',header.length,', data == ',data.length);
        return null;
    }

    var now = moment().local();
    var result = { TIME: moment(data[header.indexOf('DATE')] + data[header.indexOf('TIME')], 'MM/DDHH:mm:ss').local().toISOString() };
    header.forEach(function(h,i)
    {
        if(!(h === 'H' || h === 'DATE' || h === 'TIME'))
        {
            result[h] = parseFloat(data[i]);
        }
    });

    return result;
}

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

            console.log('Using:',stationPort);

            var stationStream = new serialport.SerialPort(stationPort.comName, {
                baudrate: 9600,
                parser: serialport.parsers.readline("\r\n"),
            }, false); // Do not auto-open

            var state = 0;
            var header;
            var lines;

            stationStream.on('data', function(data)
            {
                console.log('Pre data:',data);
                switch(state)
                {
                    case 0:
                        data = data.replace(/^\>+/,'');
                        console.log('Post data:',data);
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
                        else
                        {
                            console.error("Unexpected:",data);
                        }
                        break;

                    case 1:
                        data = data.replace(/^\>+/,'');
                        if(header === undefined && data.match(/^H,/))
                        {
                            header = data.split(',');
                            console.log('Got header',header);
                        }
                        else if(data.match(/^D,/))
                        {
                            lines.push(parseWeatherLine(header, data.split(','))); // Initial chops off the checksum field
                        }
                        else if(data === 'OK')
                        {
                            // Got 'OK trailer'
                            console.log('Received',lines.length,'cached lines');
                            console.log(lines);
                            state++;
                            stationStream.write(':z');
                        }
                        else
                        {
                            console.error('Unexpected:',data);
                        }
                        break;

                    case 2:
                        data = data.replace(/^\>+/,'');
                        if(data === 'OK')
                        {
                            console.log('Data cleared OK');
                            state++;
                            stationStream.write(':K'+moment().local().format('MMDDHHmmss'));
                        }
                        else
                        {
                            console.error('Unexpected:',data);
                        }
                        break;

                    case 3:
                        data = data.replace(/^\>+/,'');
                        if(data === 'OK')
                        {
                            console.log('Date set OK');
                            stationStream.write(':a');
                            state++;
                        }
                        else
                        {
                            console.error('Unexpected:',data);
                        }
                        break;

                    case 4:
                        data = data.replace(/^\>+/,'');
                        if(data === 'OK')
                        {
                            console.log('Automatic reporting now on');
                        }
                        else if(data.match(/^D,/))
                        {
                            console.log('Received:',parseWeatherLine(header, _.initial(data.split(',')))); // Initial chops off the checksum field
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
                console.log('Serial port open; sending init sequence');
                stationStream.write(':::::::::::::::::Q');
            });

            // Now open the port since all handlers registered
            stationStream.open(function(err)
            {
                if(err) console.error('Serial port open error:', err);
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
