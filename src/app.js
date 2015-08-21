var weather       = new (require('wundergroundnode'))('***REMOVED***');
var twilio        = require('twilio')('***REMOVED***', '***REMOVED***');
var influx        = require('influx')({host:'localhost',database:'weather'});

var http          = require('http');
var https         = require('https');
var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');
var compression   = require('compression');
var cookieSession = require('cookie-session');
var serveStatic   = require('serve-static');

var routes        = require('./routes/index')(influx, weather, twilio);

var logger        = require('./lib/logger');

var app = express();

app.set('port', process.env.PORT || 3000);

app.use(compression());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'public')));

app.use(logger.logger);

app.use(cookieParser('cienega-weather'));
app.use(cookieSession({secret: 'cienega-weather'}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true , parameterLimit: 50000, limit: 10 * 1024 * 1024 }));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next)
{
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
app.use(function(err, req, res, next)
{
    res.status(err.status || 500).render('error',
    {
        message: err.message,
        stack:   err.stack,
    });
});

http.createServer(app).listen(app.get('port'), function()
{
    console.log('Express server listening on port ' + app.get('port'));
});
