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
        mochaTest: {
            'test': {
                'options': {
                    'require': 'babel-register',
                    'reporter': 'spec',
                    'quiet': false,
                    'clearRequireCache': false
                },
                'src': ['test/**/*.js']
            }
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
        'mochaTest'
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
