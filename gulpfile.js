var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha');

var paths = {
  gulpfile: 'gulpfile.js',
  lib: 'pipeline.js',
  spec: 'spec/**/*.spec.js'
};

paths.js = [ paths.gulpfile, paths.lib, paths.spec ];

gulp.task('lint', function() {
  return gulp.src(paths.js)
    .pipe(jshint({ expr: true }))
    .pipe(jshint.reporter('default'));
});

gulp.task('spec', function() {
  return gulp.src(paths.spec)
    .pipe(mocha({ reporter: 'dot' }));
});

gulp.task('watch', function () {
  gulp.watch(paths.js, ['lint', 'spec']);
});

gulp.task('default', ['lint', 'spec']);