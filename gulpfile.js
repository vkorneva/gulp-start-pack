const { src, dest, parallel, series, watch } = require('gulp');
const browserSync                            = require('browser-sync').create();
const concat                                 = require('gulp-concat');
const uglify                                 = require('gulp-uglify-es').default;
const sass                                   = require('gulp-sass');
const autoprefixer                           = require('gulp-autoprefixer');
const cleancss                               = require('gulp-clean-css');
const imagemin                               = require('gulp-imagemin');
const newer                                  = require('gulp-newer');
const del                                    = require('del');

const preprocessor                           = 'sass';

function browsersync () {
    browserSync.init({
        server: { baseDir: 'app/' },
        notify: false,
        online: true,
    });
}

function scripts () {
    const jsFiles = [
        'node_modules/jquery/dist/jquery.min.js',
        'app/js/app.js',
    ];

    return src(jsFiles)
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js/'))
        .pipe(browserSync.stream());
}

function styles () {
    const mainSassFilePath     = `app/${preprocessor}/main.${preprocessor}`;
    const mainSassFileDistPath = 'app/css/';

    return src(mainSassFilePath)
        .pipe(eval(preprocessor)())
        .pipe(concat('app.min.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid                : true,
        }))
        .pipe(cleancss({
            level: {
                1: {
                    specialComments: 0,
                },
            },
        }))
        .pipe(dest(mainSassFileDistPath))
        .pipe(browserSync.stream());
}

function images () {
    const imagesPath     = 'app/assets/images/**/*';
    const imagesDistPath = 'app/assets/images/dest/';

    return src(imagesPath)
        .pipe(newer(imagesDistPath))
        .pipe(imagemin())
        .pipe(dest(imagesDistPath));
}

function cleanImagesDist () {
    const imagesPath = 'app/assets/images/dest/**/*';
    return del(imagesPath, { force: true });
}

function copyBuildFilesToDist () {
    const files = [
        'app/css/**/*.min.css',
        'app/js/**/*.min.js',
        'app/assets/images/dest/**/*',
        'app/**/*.html',
    ];

    return src(files, { base: 'app' })
        .pipe(dest('dist'));
}

function cleanDist () {
    const distPath = 'dist/**/*';

    return del(distPath, { force: true });
}

function startWatch () {
    const includedJsFiles = 'app/**/*.js';
    const excludedJsFiles = '!app/**/*.min.js';
    const sassFiles       = `app/**/${preprocessor}/**/*`;
    const htmlFiles       = 'app/**/*.html';
    const imagesFiles     = 'app/images/src/**/*';

    watch([includedJsFiles, excludedJsFiles], scripts);
    watch(sassFiles, styles);
    watch(htmlFiles).on('change', browserSync.reload);
    watch(imagesFiles, images);
}

exports.browsersync     = browsersync;
exports.scripts         = scripts;
exports.styles          = styles;
exports.images          = images;
exports.cleanImagesDist = cleanImagesDist;

exports.build   = series(cleanDist, styles, scripts, images, copyBuildFilesToDist);
exports.default = parallel(styles, scripts, browsersync, startWatch);
