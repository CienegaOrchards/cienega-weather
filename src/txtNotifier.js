var logger = require('./lib/logger');

var nconf         = require('nconf');
nconf.argv().env().file({ file: 'api-keys.json' });

var twilio = require('twilio')(nconf.get('TWILIO:ACCOUNT_SID'), nconf.get('TWILIO:AUTH_TOKEN'));

twilio.messages.create({
    to: "+16508514450",
    from: nconf.get('TWILIO:SENDING_NUMBER'),
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
