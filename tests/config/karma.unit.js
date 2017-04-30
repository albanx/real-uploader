/**
 * Created by Alban Xhaferllari on 22/05/2015.
 */
module.exports = function(config) {
    config.set({

        // basepath to use
        basePath: '../../',

        //testing frameworks to use
        frameworks: ['jasmine', 'requirejs'],

        //files to load for loading our app
        files: [
            {pattern: 'libs/**/*.js', included: false},
            {pattern: 'js/**/*.js', included: false},
            {pattern: 'tests/**/*spec.js', included: false},
            'tests/config/main-test.js'
        ],
        exclude: [
            'js/main.js'
        ],
        preprocessors: {
            'js/*.js': 'coverage'
        },
        reporters: ['progress', 'coverage'],
        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [ 'PhantomJS', 'Chrome'],
        colors: true,
        singleRun: false,
        autoWatch: true,

    });
};