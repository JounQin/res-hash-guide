var gulp = require('gulp');
var autoprefixer = require('autoprefixer');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');
var hashManifest = require('gulp-json-hash-manifest');
var insert = require('gulp-insert');
var less = require('gulp-less');
var notify = require('gulp-notify');
var postcss = require('gulp-postcss');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var rimraf = require('gulp-rimraf');
var shell = require('gulp-shell');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var CONTEXT = '/GitHub/res-hash-guide';

gulp.task('scss', function () {
    return gulp.src('src/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cssnano({safe: true}))
        .pipe(postcss([autoprefixer({browsers: '> 1% in CN'})]))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: CONTEXT + '/src/scss'
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('less', function () {
    return gulp.src(['src/less/*.less', '!src/less/bootstrap.less'])
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(cssnano({safe: true}))
        .pipe(postcss([autoprefixer({browsers: '> 1% in CN'})]))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: CONTEXT + '/src/less'
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('bootstrap-less', function () {
    return gulp.src('src/less/bootstrap.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(cssnano({safe: true}))
        .pipe(postcss([autoprefixer({browsers: '> 1% in CN'})]))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: CONTEXT + '/src/less'
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('js', function () {
    return gulp.src('src/js/*.js')
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: CONTEXT + '/src/js'
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('bootstrap-js', function () {
    var bootstrapArr = [
        'transition',
        'alert',
        'button',
        'carousel',
        'collapse',
        'dropdown',
        'modal',
        'tooltip',
        'popover',
        'scrollspy',
        'tab',
        'affix'
    ].map(function (module, index) {
        return 'src/js/bootstrap/' + module + '.js'
    });

    return gulp.src(bootstrapArr)
        .pipe(sourcemaps.init())
        .pipe(concat('bootstrap.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: CONTEXT + '/src/js/bootstrap'
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('manifestJson', function () {
    return gulp.src('dist/**/*.?(js|css|html)')
        .pipe(hashManifest({dest: 'dist'}));
});

gulp.task('replaceManifestJson', function () {
    return gulp.src('dist/hash-manifest.json')
        .pipe(replace(/^\{/gi, '{"hash-manifest.js":' + +new Date + ','))
        .pipe(gulp.dest('dist'));
});

gulp.task('manifestJs', function () {
    return gulp.src('dist/hash-manifest.json')
        .pipe(insert.prepend('var manifest='))
        .pipe(rename({extname: '.js'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('replace', function () {
    var manifest = require('./dist/hash-manifest.json');
    return gulp.src('src/**/*.html')
        .pipe(replace(/\/([\w\-\.])+(['"]\)})?\?(hashversion)/gi, function (matched) {
            matched = matched.substring(1, matched.length - 12);
            var fileName = matched.replace(/['"]\)}/, '');
            for (var key in manifest) {
                if (key.endsWith('/' + fileName) || key === fileName) {
                    return '/' + matched + '?' + manifest[key];
                }
            }
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('rimraf', function () {
    return gulp.src('dist')
        .pipe(rimraf({read: false}));
});

gulp.task('deploy', shell.task([
    'gulp rimraf',
    'gulp scss less js bootstrap-less bootstrap-js',
    'gulp manifestJson',
    'gulp replaceManifestJson',
    'gulp manifestJs replace'
]));