module.exports = {
    env:
    {
        es6: true,
        mocha: true,
    },
    plugins:
    [
        'if-in-test',
        'should-promised',
    ],
    rules:
    {
        'if-in-test/if':                  [ 1, { directory: 'test' }],
        'should-promised/return-promise': 2,
    }
};
