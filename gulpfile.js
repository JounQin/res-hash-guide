const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const cleancss = require('gulp-clean-css');
const concat = require('gulp-concat');
const del = require('del');
const hashManifest = require('gulp-json-hash-manifest');
const insert = require('gulp-insert');
const less = require('gulp-less');
const notify = require('gulp-notify');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const shell = require('gulp-shell');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

const CONTEXT = '/GitHub/res-hash-guide';

gulp.task('scss', function () {
    return gulp.src('src/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cleancss())
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
        .pipe(cleancss())
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
        .pipe(cleancss())
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
    const bootstrapArr = [
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
        .pipe(insert.prepend('const manifest='))
        .pipe(rename({extname: '.js'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('replace', function () {
    const manifest = require('./dist/hash-manifest.json'),
        defaultEmpty = function (str) {
            return str || '';
        };
    return gulp.src('src/**/*.html')
        .pipe(replace(/((\.\.\/)*)(dist\/)([\w][./\w\-]+\.(css|js))/gi, function (matched, $1, $2, $3, $4) {
            'use strict';
            let filePath = $4,
                hashVersion = manifest[filePath];
            
            if (!hashVersion) {
                for (const path in manifest) {
                    if (!manifest.hasOwnProperty(path)) continue;
                    if (path.endsWith(filePath)) {
                        hashVersion = manifest[path];
                        break;
                    }
                }
            }

            return defaultEmpty($1) + defaultEmpty($3) + $4 + '?' + defaultEmpty(hashVersion);
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    return del('dist');
});

gulp.task('deploy', shell.task([
    'gulp clean',
    'gulp scss less js bootstrap-less bootstrap-js',
    'gulp manifestJson',
    'gulp replaceManifestJson',
    'gulp manifestJs replace'
]));