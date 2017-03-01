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
            package: {
                options: {
                    configFile: 'tests/config/karma-package.unit.js'
                }
            },
            application: {
                options: {
                    configFile: 'tests/config/karma-app.unit.js'
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
                                var buildType = [{
                                    name: 'Build package v.' + grunt.config.get('version'),
                                    value: 'build'
                                }, {
                                    name: 'Generate Doc',
                                    value: 'generateDoc'
                                }, {
                                    name: 'Build i18n',
                                    value: 'i18n'
                                }];

                                return buildType;
                            }
                        },
                        {
                            config: 'prompt.execute',
                            type: 'confirm',
                            message: 'Tasks ready to run. Continue?'
                        }
                    ],
                    then: function (results, done) {
                        if (results['prompt.execute']) {
                            grunt.config.set('buildType', results['prompt.buildType']);

                            if (results['prompt.buildType'] == 'build') {
                                grunt.task.run(['doBuild']);
                            } else if (results['prompt.buildType'] == 'generateDoc') {
                                grunt.task.run(['generateDoc']);
                            } else if (results['prompt.buildType'] == 'i18n') {
                                grunt.task.run(['i18n']);
                            }
                        }
                    }
                }
            }
        },

        template: {
            commercial: {
                options: {
                    data: {
                        builddate: new Date(),
                        version: grunt.config.get('version'),
                        MD5_ON: 'true',
                        IMAGE_SCALE_ON: 'true',
                        EXIF_ON: 'true',
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
            commercial: {
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
                    //Copy to web site repo
                    {
                        expand: false,
                        src: ['build/temp/realuploader-min.js'],
                        dest: 'web/js/jquery-ui.js',
                        filter: 'isFile'
                    },

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
            },
            zip: {
                files: [
                    {
                        expand: false,
                        src: ['build/v<%=version%>.zip'],
                        dest: 'build/realuploader-commercial.zip',
                        filter: 'isFile'
                    },
                    {
                        expand: false,
                        src: ['build/v<%=version%>.zip'],
                        dest: 'build/realuploader-enterprise.zip',
                        filter: 'isFile'
                    }
                ]
            }
        },

        compress: {
            commercial: {
                options: {
                    archive: 'build/v<%=version%>.zip'
                },
                files: [
                    {expand: true, cwd: 'build/prod/', src: ['**'], dest: ''} // includes files in path and its subdirs
                ]
            }
        },
        'ftp-deploy': {
            upload: {
                auth: {
                    host: 'ftp.realuploader.com',
                    port: 21,
                    authKey: 'realuploader'
                },
                src: 'build/*.zip',
                dest: 'web/download/'
            }
        },
        shell: {}
    });

    grunt.registerTask('default', ['prompt:buildprompt']);

    grunt.registerTask('build', 'Just build the requirejs', function () {
        grunt.task.run('requirejs:dev');//compile js
    });

    grunt.registerTask('doBuild', 'Main task runner', function () {
        var tasks = [];
        tasks.push('template:commercial');//set constants vars
        tasks.push('requirejs:dev');//compile js
        tasks.push('requirejs:min');//compile js min
        tasks.push('compass:dev');//compile sass to css (not needed in this case)
        tasks.push('copy:commercial');
        tasks.push('compress:commercial');
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
