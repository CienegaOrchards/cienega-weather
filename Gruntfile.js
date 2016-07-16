module.exports = function (grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        clean: {
            'options': { 'force': true },
            'build': ['build/*'],
            'coverage': ['coverage/*']
        },
        eslint: {
            'options': { 'maxWarnings': 0 },
            'lint': [
                'src',
                'test'
            ]
        },
        mocha_istanbul:
        {
            coverage:
            {
                src: ['test/**/*.js'],
                options:
                {
                    reportFormats: ['html'],
                    root: 'src',
                    coverageFolder: 'coverage',
                    recursive: true,
                    quiet: false,
                    clearRequireCache: true,
                    reporter: 'spec',
                    slow: 1,
                    timeout: 10000,
                    scriptPath: require.resolve('isparta/bin/isparta'),
                    nodeExec: require.resolve('.bin/babel-node'),
                    mochaOptions: ['--compilers', 'js:babel-register'],
                    istanbulOptions: ['--include-all-sources'],
                },
            },
        },
        flow: { 'sources': { 'options': { 'style': 'color' } } },
        babel: {
            'options': { 'presets': ['es2015'] },
            'build': { 'files': { 'build/index.js': 'src/index.js' } }
        },
        lambda_package: { 'default': { 'options': { 'dist_folder': 'build' } } },
        lambda_deploy: {
            'default': {
                'arn': 'arn:aws:lambda:us-west-2:281650663203:function:cienegaWeather',
                'options': { 'region': 'us-west-2' }
            }
        },
        lambda_invoke: {
            'default': {
                'options': {
                    'file_name': 'build/index.js',
                    'handler': 'sendMinimumForecast',
                    'event': 'test/data/lambda-event.json'
                }
            }
        }
    });
    grunt.registerTask('lint', ['eslint']);
    grunt.registerTask('test', [
        'lint',
        'flow',
        'mocha_istanbul'
    ]);
    grunt.registerTask('build', [
        'clean',
        'babel'
    ]);
    grunt.registerTask('package', [
        'build',
        'lambda_package'
    ]);
    grunt.registerTask('deploy', [
        'package',
        'lambda_deploy'
    ]);
    grunt.registerTask('invoke', [
        'build',
        'lambda_invoke'
    ]);
    grunt.registerTask('default', ['test']);
};
