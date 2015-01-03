module.exports = function ( grunt ) {

    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
    grunt.loadNpmTasks( 'grunt-contrib-htmlmin' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-targethtml' );

    grunt.initConfig( {
        concat: {
            options: {
                separator: ';',
                sourceMap: true
            },
            build: {
                src: [ 'lib/*.js', 'src/*.js' ],
                dest: '.tmp/index.js'
            }
        },
        uglify: {
            options: {
                banner: '/* hangouts-analyzer by @theopolisme */',
                sourceMap: true,
                sourceMapIncludeSources: true,
                sourceMapIn: '.tmp/index.js.map'

            },
            build: {
                src: '<%= concat.build.dest %>',
                dest: 'index.min.js'
            }
        },
        cssmin: {
            build: {
                files: {
                    'index.min.css': [ 'lib/**/*.css', 'src/**/*.css' ]
                }
            }
        },
        targethtml: {
            build: {
                files: {
                    '.tmp/index.html': [ 'src/index.html' ]
                }
            }
        },
        htmlmin: {
            build: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeCommentsFromCDATA: true,
                    minifyJS: true,
                    processScripts: [ 'text/x-handlebars-template' ]
                },
                files: {
                     'index.html': '.tmp/index.html'
                }
            }
        },
        clean: {
            build: [ '.tmp' ]
        }
    } );

    grunt.registerTask( 'build', [ 'concat:build', 'uglify:build', 'cssmin:build', 'targethtml:build',
        'htmlmin:build', 'clean:build' ] );
};
