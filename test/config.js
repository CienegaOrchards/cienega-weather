require('chai').should();

var nconf = require('nconf');

describe('Config', function()
{
    var config;

    before(function()
    {
        nconf.argv().env().file({ file: 'default-api-keys.json' });
        config = nconf.get();
    });

    describe('Required settings', function()
    {
        it('should have required API entries', function()
        {
            config.should.have.property('WUNDERGROUND');
            config.should.have.property('TWILIO');
        });

        it('should have required WUNDERGROUND settings', function()
        {
            config.WUNDERGROUND.should.have.property('API_KEY');
            config.WUNDERGROUND.should.have.property('RANCH_PWS');
            config.WUNDERGROUND.should.have.property('PORTOLA_VALLEY_PWS');
        });

        it('should have required TWILIO settings', function()
        {
            config.TWILIO.should.have.property('ACCOUNT_SID');
            config.TWILIO.should.have.property('AUTH_TOKEN');
            config.TWILIO.should.have.property('SENDING_NUMBER');
        });
    });
});
