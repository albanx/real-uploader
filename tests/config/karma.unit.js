/**
 * Created by Alban Xhaferllari on 22/05/2015.
 */
module.exports = function(config) {
    config.set({

        // basepath to use
        // basePath: '../../',

        //testing frameworks to use
        frameworks: ['jasmine'],

        //files to load for loading our app
        files: [
            'js/ImageEditor.js',
            'tests/specs/*.js'
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
        browsers: [ 'PhantomJS'],
        colors: true,
        singleRun: false,
        autoWatch: true
    });
};