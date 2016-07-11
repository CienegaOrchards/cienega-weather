'use strict';

module.exports =
{
    env:
    {
        es6:   true,
        mocha: true,
    },
    plugins:
    [
        'if-in-test',
        'should-promised',
    ],
    rules:
    {
        'if-in-test/if':                  ['warn', { directory: 'test' }],
        'should-promised/return-promise': 'error',
    },
};
