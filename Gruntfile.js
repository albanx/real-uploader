//Build grunt file
module.exports = function (grunt) {
    "use strict";

    // load all tasks from the package.json file using load-grunt-tasks
    require('load-grunt-tasks')(grunt, {
        scope: ['devDependencies', 'optionalDependencies']
    });

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma: {
            watch: {
                options: {
                    configFile: 'tests/config/karma.unit.js',
                    singleRun: false
                }
            },
            single: {
                options: {
                    configFile: 'tests/config/karma.unit.js',
                    singleRun: true
                }
            }
        },

        jsdoc: {
            dist: {
                src: ['js/**/*.js', 'README.md'],
                options: {
                    destination: 'docs',
                    template: 'node_modules/ink-docstrap/template',
                    configure: 'node_modules/ink-docstrap/template/jsdoc.conf.json'
                }
            }
        },

        prompt: {
            buildprompt: {
                options: {
                    questions: [
                        {
                            config: 'prompt.buildType',
                            message: 'Select option:',
                            default: 'default',
                            type: 'list',
                            choices: function () {
                                var json = grunt.file.readJSON('version.json');
                                grunt.config.set('version', json.version);
                                return [{
                                    name: 'Build package v.' + grunt.config.get('version'),
                                    value: 'build'
                                }, {
                                    name: 'Generate Doc',
                                    value: 'generateDoc'
                                }, {
                                    name: 'Build i18n',
                                    value: 'i18n'
                                }];
                            }
                        },
                        {
                            config: 'prompt.execute',
                            type: 'confirm',
                            message: 'Tasks ready to run. Continue?'
                        }
                    ],
                    then: function (results, done) {
                        var buildType = results['prompt.buildType'];
                        if (results['prompt.execute']) {
                            grunt.config.set('buildType', results['prompt.buildType']);

                            if (buildType === 'build') {
                                grunt.task.run(['doBuild']);
                            } else if (buildType === 'generateDoc') {
                                grunt.task.run(['generateDoc']);
                            } else if (buildType === 'i18n') {
                                grunt.task.run(['i18n']);
                            }
                        }
                    }
                }
            }
        },

        template: {
            semver: {
                options: {
                    data: {
                        builddate: new Date(),
                        version: grunt.config.get('version'),
                        ENV: 'PROD'
                    }
                },
                files: [
                    {src: 'js/Constants.tpl.js', dest: 'js/Constants.js'},
                    {src: 'start.tpl.frag', dest: 'start.frag'}
                ]
            }
        },

        /**
         * Compile JS files to a single file
         */
        requirejs: {
            dev: {
                options: {
                    baseUrl: 'js',
                    name: 'RealUploader',
                    mainConfigFile: 'js/main.js',
                    out: 'build/temp/realuploader.js',
                    almond: true,
                    wrap: {
                        startFile: 'start.frag',
                        endFile: 'end.frag'
                    },
                    optimize: "none"
                }
            },
            min: {
                options: {
                    baseUrl: 'js',
                    name: 'RealUploader',
                    mainConfigFile: 'js/main.js',
                    out: 'build/temp/realuploader-min.js',
                    almond: true,
                    wrap: {
                        startFile: 'start.frag',
                        endFile: 'end.frag'
                    },
                    optimize: 'uglify'
                }
            }
        },

        /**
         * Compile sass files to create the final CSS
         */
        compass: {
            dev: {
                options: {
                    config: 'config.rb'
                }
            }
        },

        /**
         * Copy created files to create the packages
         */
        copy: {
            build: {
                files: [
                    //License
                    {
                        expand: true,
                        src: ['LICENSE_COMMERCIAL.TXT'],
                        dest: 'build/prod/',
                        filter: 'isFile',
                        flatten: true
                    },
                    {
                        expand: true,
                        src: ['LICENSE_ENTERPRISE.TXT'],
                        dest: 'build/prod/',
                        filter: 'isFile',
                        flatten: true
                    },

                    //copy all CSS files, all themes
                    {expand: true, src: ['css/*.css'], dest: 'build/prod/css/', filter: 'isFile', flatten: true},

                    //copy minifield and not compressed files
                    {expand: true, src: ['build/temp/*.js'], dest: 'build/prod/js/', filter: 'isFile', flatten: true},
                    {expand: false, src: ['examples.html'], dest: 'build/prod/', filter: 'isFile'},
                    {expand: false, src: ['upload.php', 'upload.jsp'], dest: 'build/prod/', filter: 'isFile'},

                    //copy all project source
                    {
                        expand: true,
                        src: ['js/**', 'sass/**', 'libs/**', 'tests/**', '!js/*.tpl.js'],
                        dest: 'build/prod/source/'
                    }
                ]
            }
        },

        compress: {
            build: {
                options: {
                    archive: 'build/v<%=version%>.zip'
                },
                files: [
                    {expand: true, cwd: 'build/prod/', src: ['**'], dest: ''} // includes files in path and its subdirs
                ]
            }
        },
        watch: {
            scripts: {
                files: ['js/**/*.js'],
                tasks: ['compass:dev'],
                options: {
                    spawn: false
                }
            },
            styles: {
                files: ['sass/**/*.scss'],
                tasks: ['compass:dev'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.registerTask('default', ['prompt:buildprompt']);
    grunt.registerTask('test', ['karma']);

    grunt.registerTask('build', 'Just build the requirejs', function () {
        grunt.task.run('requirejs:dev');//compile js
    });

    grunt.registerTask('doBuild', 'Main task runner', function () {
        var tasks = [];
        tasks.push('template:semver');//set version
        tasks.push('requirejs:dev');//compile js
        tasks.push('requirejs:min');//compile js min
        tasks.push('compass:dev');//compile sass to css (not needed in this case)
        tasks.push('copy:build');
        tasks.push('compress:build');
        grunt.task.run(tasks);
    });

    grunt.registerTask('generateDoc', '', function () {
        var tasks = [];
        tasks.push('jsdoc');
        grunt.task.run(tasks);
    });

    grunt.registerTask('i18n', '', function () {
        var files = grunt.file.expand(['js/*.js']);
        for (var i = 0; i < files.length; i++) {
            var matches = grunt.file.read(files[i]).match(/\_\((.*?)\)/gmi);
            if (matches) {
                for (var j = 0; j < matches.length; j++) {
                    console.log(matches[j].replace('_(', '').replace(')', ''));
                }
            }
        }
    });
};
