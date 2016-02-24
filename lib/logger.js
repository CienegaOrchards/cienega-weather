// Modeled on intercept by console-stamp

var moment = require('moment');
var morgan = require('morgan');

var MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS ZZ';

function MOMENT_FORMAT_NOW()
{
    return moment().utc().format(MOMENT_FORMAT);
}

morgan.token('timestamp', MOMENT_FORMAT_NOW);
morgan.token('route', function(req) { return req.route && req.route.path || '***'; });
morgan.token('user', function(req) { return req.user && req.user._id || '-'; });

morgan.format('mydev', function(tokens, req, res)
{
    var status = res.statusCode;
    var color = 32;

    if(status >= 500) { color = 31; }
    else if(status >= 400) { color = 33; }
    else if(status >= 300) { color = 36; }

    // Build up format string for Morgan
    var fn = '[:timestamp] \x1b[90m:method :url :route \x1b[' + color + 'm:status \x1b[90m' + (new Date() - req._startTime) + 'ms :referrer \x1b[0m[:remote-addr] ~:user~';
    fn = '  return "' + fn.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function(_, name, arg)
    {
        return '"\n    + (tokens["' + name + '"](req, res, ' + String(JSON.stringify(arg)) + ') || "-") + "';
    }) + '";';
    // jshint evil: true
    fn = new Function('tokens, req, res', fn);
    // jshint evil: false

    return fn(tokens, req, res);
});

var morganLogger = morgan('mydev');


if(console.__intercepted__) {
    return;
}

var slice = Array.prototype.slice;

['log', 'info', 'warn', 'error', 'dir', 'assert'].forEach(function(f)
{
    var org = console[f];

    console[f] = function()
    {
        var date = '[' + MOMENT_FORMAT_NOW() + '] [' + f.toUpperCase() + '] ',
            args = slice.call(arguments);

        if(f === 'error' || f === 'warn' || (f === 'assert' && !args[0]))
        {
            process.stderr.write(date);
        }
        else if(f !== 'assert')
        {
            process.stdout.write(date);
        }

        return org.apply(console, args);
    };
});

console.__intercepted__ = true;


module.exports = {
    logger : function(req, res, next)
    {
        return morganLogger(req, res, next);
    },
};
