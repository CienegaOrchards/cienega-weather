var should = require('chai').should();

var main = require('../wundergroundMonitor.js');

describe('SendMessage', function()
{
    it('should return a message', function()
    {
        main.sendMinimumForecast(null,
        {
            succeed: function(msg)
            {
                should.exist(msg);
                msg.should.be.a('string');
            },
            fail: function(err)
            {
                should.not.exist(err);
            },
        });
    });
});
