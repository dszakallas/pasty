gulp          = require 'gulp'
watch         = require 'gulp-watch'
plumber       = require 'gulp-plumber' # Fix pipes on errors.
lazypipe      = require 'lazypipe' # We need this to make reusable pipes. How sad is that?
autoprefixer  = require 'gulp-autoprefixer'
sass          = require 'gulp-sass'
sourcemaps    = require 'gulp-sourcemaps'
coffee        = require 'gulp-coffee'

stylePipe = lazypipe()
  .pipe sourcemaps.init
  .pipe sass
  .pipe autoprefixer, browsers: ['last 2 versions']
  .pipe sourcemaps.write

gulp.task 'lib', ->
  gulp.src 'src/server/**/*.coffee'
    .pipe coffee()
    .pipe gulp.dest 'lib'

gulp.task 'watch-index', ->
  gulp.src 'src/client/index.html'
    .pipe watch 'src/client/index.{htm,html}' #How shitty is that you can't watch paths without wildcards?
    .pipe plumber()
    .pipe gulp.dest 'public'

gulp.task 'watch-parts', ->
  gulp.src 'src/client/parts/*.html'
    .pipe watch 'src/client/parts/*.html'
    .pipe plumber()
    .pipe gulp.dest 'public/parts'

gulp.task 'watch-styles', ->
  gulp.src 'src/client/styles/*.sass'
    .pipe watch 'src/client/styles/*.sass'
    .pipe stylePipe()
    .pipe gulp.dest 'public/css'

gulp.task 'watch-scripts', ->
  gulp.src 'src/client/scripts/*.js'
    .pipe watch 'src/client/scripts/*.js'
    .pipe plumber()
    .pipe gulp.dest 'public/js'

gulp.task 'index', ->
  gulp.src 'src/client/index.html'
    .pipe gulp.dest 'public'

gulp.task 'parts', ->
  gulp.src 'src/client/parts/*.html'
    .pipe gulp.dest 'public/parts'

gulp.task 'styles', ->
  gulp.src 'src/client/styles/*.sass'
    .pipe stylePipe()
    .pipe gulp.dest 'public/css'

gulp.task 'scripts', ->
  gulp.src 'src/client/scripts/*.js'
    .pipe gulp.dest 'public/js'


gulp.task 'build', [ 'index', 'styles', 'lib', 'parts', 'scripts' ]
gulp.task 'watch', [ 'watch-index', 'watch-styles', 'watch-parts', 'watch-scripts' ]
gulp.task 'default', [ 'build' ]
