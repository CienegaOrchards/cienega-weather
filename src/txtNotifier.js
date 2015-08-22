var logger = require('./lib/logger');
var influx = require('influx')({host:'localhost',database:'weather'});
var twilio = require('twilio')('***REMOVED***', '***REMOVED***');

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
