gulp          = require 'gulp'
lazypipe      = require 'lazypipe' # We need this to make reusable pipes. How sad is that?
autoprefixer  = require 'gulp-autoprefixer'
sass          = require 'gulp-sass'
sourcemaps    = require 'gulp-sourcemaps'
coffee        = require 'gulp-coffee'
livereload    = require 'gulp-livereload'

stylePipe = lazypipe()
  .pipe sourcemaps.init
  .pipe sass
  .pipe autoprefixer, browsers: ['last 2 versions']
  .pipe sourcemaps.write


gulp.task 'lib', ->
  gulp.src 'src/server/**/*.coffee'
    .pipe coffee()
    .pipe gulp.dest 'lib'

gulp.task 'index', ->
  gulp.src 'src/client/index.html'
    .pipe gulp.dest 'public'
    .pipe livereload()

gulp.task 'parts', ->
  gulp.src 'src/client/parts/*.html'
    .pipe gulp.dest 'public/parts'
    .pipe livereload()

gulp.task 'styles', ->
  gulp.src 'src/client/styles/*.sass'
    .pipe stylePipe()
    .pipe gulp.dest 'public/css'
    .pipe livereload()

gulp.task 'scripts', ->
  gulp.src 'src/client/scripts/*.js'
    .pipe gulp.dest 'public/js'
    .pipe livereload()

gulp.task 'watch', ->
  livereload.listen()
  gulp.watch 'src/client/index.{htm,html}', ['index']
  gulp.watch 'src/client/styles/*.sass', ['styles']
  gulp.watch 'src/client/parts/*.html', ['parts']
  gulp.watch 'src/client/scripts/*.js', ['scripts']

gulp.task 'build', [ 'index', 'styles', 'lib', 'parts', 'scripts' ]

gulp.task 'default', [ 'build' ]
