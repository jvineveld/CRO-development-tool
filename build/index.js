/**
 * This file will start a watcher on the /klanten/ folder
 * when a change has been found in a file, it will try to compile the assats with babel
 * and create a bundled file
 *
 * use the chrome plugin for hot reloading current page with css and js inject
 *
 * @author Jonas van Ineveld
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chokidar from 'chokidar';
import { rootDir, getFile, getInfoFromPath, ensureExists, stripWorkDir, getProjectFolder } from './helpers.js';
import { rollup } from 'rollup';
import { string } from 'rollup-plugin-string';
import modify from 'rollup-plugin-modify';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import sass from 'node-sass';
import nodeResolve from 'rollup-plugin-node-resolve';
import fs from 'fs';
import moment from 'moment';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
// const cliSpinners = require('cli-spinners');
import ora from 'ora';
import chalk from 'chalk';
import { liveReload } from './live-reload-server.js';
import { terser } from 'rollup-plugin-terser';
import prettier from 'rollup-plugin-prettier';
import json from 'rollup-plugin-json';
// const {rollupExtractConfig} = require('./rollup-extract-config');
const defaultBrowserTarget = 'Edge >=12 and > 0% in alt-EU, Firefox >= 30 and > 0% in alt-EU, Chrome >= 30 and > 0% in alt-EU, Safari >= 7.1 and > 0% in alt-EU, ios_saf >= 6.0 and > 0% in alt-EU, last 1 and_ff version and > 0% in alt-EU, last 1 and_chr versions and > 0% in alt-EU, samsung >= 8.2 and > 0% in alt-EU, android >= 4.2 and > 0% in alt-EU';
const babelOptions = (env = 'dev', babelOptions) => {
    let config = {
        'runtimeHelpers': true,
        'presets': [
            ['@babel/preset-env', {
                    'targets': {
                        browsers: babelOptions.browserTarget ? babelOptions.browserTarget : defaultBrowserTarget,
                    },
                    // 'debug': true,
                    // 'useBuiltIns': 'usage',
                    // 'corejs': 2,
                    'modules': false,
                }]
        ],
        exclude: 'node_modules/**',
        plugins: [
            ['transform-class-properties', { spec: false }],
            ['@babel/plugin-transform-runtime', {
                    'regenerator': true
                }]
        ]
    };
    if (babelOptions.longParse) {
        // config.presets[0][1].corejs = '2';
        // config.presets[0][1].useBuiltIns = 'usage';
    }
    // if(babelOptions.debug){
    // 	config.presets[0][1].debug = true;
    // }
    if (env === 'prod') {
        // config.plugins.push(['transform-remove-console', {'exclude': [ 'error', 'warn']}]);
    }
    return config;
};
const bundleOptions = (env = 'dev', bundleOptions) => {
    const bundlerModules = [
        babel(babelOptions(env, bundleOptions.babelOptions)),
        nodeResolve(),
        commonjs(),
        string({
            include: '**/*.html',
        }),
        json(), // support for including .json files as import
        // rollupExtractConfig()
    ];
    if (env === 'dev') {
        bundlerModules.push(prettier({
            parser: 'babel',
            useTabs: true,
            singleQuote: true,
        }));
    }
    if (env === 'prod') {
        bundlerModules.push(modify({
            find: '\\t',
            replace: ''
        }));
        if (!bundleOptions.preventMinify) {
            bundlerModules.push(terser({
                mangle: false
            })); // minify and uglify the code so it's smaller
        }
    }
    return bundlerModules;
};
// to keep track of last generated resources to push to websocket,
// we store it here. So this is for when compiling JS, also sending the latest css with it
const lastCompiledResources = {
    css: '',
    js: ''
};
const getResource = function (path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (fs.existsSync(path)) {
                return new Promise((resolve, reject) => {
                    fs.readFile(path, 'utf8', function (err, contents) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(contents);
                    });
                }).catch(err => {
                    console.error(err);
                });
            }
        }
        catch (err) {
            console.error(err);
        }
        return false;
    });
};
const requestTestFiles = function (test) {
    return __awaiter(this, void 0, void 0, function* () {
        let testDir = rootDir + '/klanten/' + test.customer + '/' + test.test + (test.variation ? '/' + test.variation : ''), cssDevPath = testDir + '/generated/dev/output.css', jsDevPath = testDir + '/generated/dev/output.js';
        // console.log({test, testDir, cssDevPath, jsDevPath})
        let css = yield getResource(cssDevPath), js = yield getResource(jsDevPath);
        return { css, js };
    });
};
const reloadSocket = new liveReload(requestTestFiles);
const buildBundle = function (path, type = 'dev', extraSettings) {
    return __awaiter(this, void 0, void 0, function* () {
        let bundleSetting = {
            babelOptions: {}
        };
        if (extraSettings) {
            if (extraSettings.browserList) {
                // shoudl do shings
                bundleSetting.babelOptions.browserTarget = extraSettings.browserList;
            }
            if (extraSettings.parser) {
                // shoudl do shings
                bundleSetting.babelOptions.longParse = true;
            }
            if (extraSettings.nominify) {
                bundleSetting.preventMinify = true;
            }
        }
        let bundlePlugins = bundleOptions(type, bundleSetting);
        let bundle = yield rollup({
            input: path,
            plugins: bundlePlugins,
            output: {
                intro: '/* Compiled: ' + moment().format('DD-MM-YYYY HH:mm:ss') + ' */'
            }
        });
        let projectFolder = path.substring(0, path.lastIndexOf('/')), bundleWriteOutputOptions = {
            file: '',
            format: 'iife',
            intro: `
/**
* SiteSpect Development
* Compiled: ` + moment().format('DD-MM-YYYY HH:mm:ss') + `
**/
`
        }, bundleWriteOptions = {
            sourceMap: 'inline',
            strict: false,
            'runtimeHelpers': false,
            plugins: bundlePlugins,
            output: bundleWriteOutputOptions
        };
        switch (type) {
            case 'dev':
                bundleWriteOptions.sourceMap = 'inline';
                bundleWriteOutputOptions.file = projectFolder + '/generated/dev/output.js';
                break;
            case 'prod':
                bundleWriteOutputOptions.file = projectFolder + '/generated/prod/output.js';
                break;
        }
        let output = yield bundle.write(bundleWriteOutputOptions);
        if (output.output[0].code) {
            let codeWithComment = output.output[0].code.replace(/\n$/g, '') + '\n/* Compiled: ' + moment().format('DD-MM-YYYY HH:mm:ss') + ' */';
            fs.writeFileSync(bundleWriteOptions.output.file, codeWithComment);
            console.log('✓ Bundled, commented and moved into extension');
        }
        return output;
    });
};
const compilationSuccess = function (file, type) {
    let time = moment().format('HH:mm:ss');
    console.log(chalk.white(chalk.bgGreenBright.black(' Lekker bezig! ') + ' ' + chalk.bgWhite.black(' ' + time + ' ') + ' ' + chalk.bgWhite.black(' ' + type + ' ') + ' ' + stripWorkDir(file)));
};
const buildSiteSpectInclude = (changedFilePath) => {
    let projectFolder = getProjectFolder(changedFilePath);
    const devJs = getFile(projectFolder + '/generated/dev/output.js'), devStyle = getFile(projectFolder + '/generated/dev/output.css'), prodJs = getFile(projectFolder + '/generated/prod/output.js'), prodStyle = getFile(projectFolder + '/generated/prod/output.css'), devOutFile = projectFolder + '/generated/sitespect-dev.html', prodOutFile = projectFolder + '/generated/sitespect-prod.html';
    let prodCode = '', devCode = '';
    if (devStyle) {
        devCode += `<style>
${devStyle}
</style>`;
    }
    if (devJs) {
        devCode += `
<script>
${devJs}
</script>`;
    }
    if (devStyle) {
        prodCode += `<style>
${prodStyle}
</style>`;
    }
    if (devJs) {
        prodCode += `
<script>
${prodJs}
</script>
		`;
    }
    fs.writeFile(devOutFile, devCode, function (error) {
        if (error) {
            console.log('error in sitespect file generation:', error);
        }
    });
    fs.writeFile(prodOutFile, prodCode, function (error) {
        if (error) {
            console.log('error in sitespect file generation:', error);
        }
    });
};
const buildSass = (path, type = 'dev') => __awaiter(void 0, void 0, void 0, function* () {
    let projectFolder = getProjectFolder(path), buildOptions = {
        file: projectFolder + '/index.scss',
        outFile: null,
        outputStyle: 'compact',
        sourceMap: false
    };
    if (!path.includes('.scss', '.sass')) {
        return;
    }
    const spinner = ora({ text: 'CSS ' + type, interval: 10 }).start();
    switch (type) {
        case 'dev':
            projectFolder + '/generated/prod/output.css';
            buildOptions.outFile = projectFolder + '/generated/dev/output.css';
            buildOptions.outputStyle = 'compact';
            buildOptions.sourceMap = false;
            break;
        case 'prod':
            buildOptions.outFile = projectFolder + '/generated/prod/output.css';
            buildOptions.outputStyle = 'compact';
            break;
    }
    let buildFolder = buildOptions.outFile.substring(0, buildOptions.outFile.lastIndexOf('/'));
    yield new Promise((res, rej) => {
        ensureExists(buildFolder, false, err => err ? rej(err) : res(true));
    });
    let cssResult = null;
    let result = yield new Promise((res, rej) => {
        try {
            // console.log('shloud be', buildOptions)
            sass.render(buildOptions, (error, result) => {
                // console.log(error, result);
                if (!error) {
                    try {
                        cssResult = result.css.toString().replace(/^\n/gm, '');
                        if (type === 'prod') {
                            postcss([autoprefixer({ overrideBrowserslist: 'last 3 versions' })]).process(cssResult, { map: false }).then(result => {
                                result.warnings().forEach(warn => {
                                    console.warn(warn.toString());
                                });
                                // No errors during the compilation, write this result on the disk
                                fs.writeFile(buildOptions.outFile, result.css, function (err) {
                                    if (err) {
                                        rej(err);
                                    }
                                    res(true);
                                });
                            });
                        }
                        else {
                            // No errors during the compilation, write this result on the disk+
                            fs.writeFile(buildOptions.outFile, result.css.toString().replace(/^\n/gm, ''), function (err) {
                                if (err) {
                                    rej(err);
                                }
                                if (!result.map) {
                                    res(true);
                                }
                            });
                            if (result.map) {
                                fs.writeFile(buildOptions.outFile + '.map', result.map, function (err) {
                                    if (err) {
                                        rej(err);
                                    }
                                    res(true);
                                });
                            }
                        }
                    }
                    catch (error) {
                        console.error(error);
                        // expected output: ReferenceError: nonExistentFunction is not defined
                        // Note - error messages will vary depending on browser
                    }
                }
                else {
                    console.log('\nFile: ' + error.file);
                    console.log('Line: ' + error.line + ':' + error.column + ' :: ' + error.message);
                }
            });
        }
        catch (error) {
            console.error(error);
            rej(error);
        }
        spinner.stop();
    });
    if (result) {
        spinner.stop();
        compilationSuccess(buildOptions.outFile, 'css');
        lastCompiledResources.css = cssResult.toString();
        let testinfo = yield getInfoFromPath(path);
        // console.log('sending path info', testinfo)
        reloadSocket.sendCSSUpdate(lastCompiledResources.css, testinfo);
    }
    spinner.stop();
});
const buildJavascript = (path) => __awaiter(void 0, void 0, void 0, function* () {
    if (!path.includes('.js')) {
        return;
    }
    const spinner = ora({ text: 'Bundeling & transpiling JS prod', interval: 10 }).start();
    let testinfo = yield getInfoFromPath(path);
    try {
        yield buildBundle(path, 'prod', testinfo.js.headers).catch(err => {
            console.error(err);
            throw new Error('Error transpiling');
        });
        // console.log('result', bundleresult)
    }
    catch (error) {
        spinner.stop();
        console.log('\n\n' + error);
        return;
    }
    spinner.text = 'Bundeling & transpiling JS dev';
    let devJSBundle = {
        output: []
    };
    try {
        devJSBundle = yield buildBundle(path, 'dev', testinfo.js.headers).catch(err => {
            console.error(err);
            throw new Error('Error transpiling ');
        });
    }
    catch (error) {
        spinner.stop();
        console.log('\n\n' + error);
        return;
    }
    lastCompiledResources.js = devJSBundle.output[0].code;
    spinner.stop();
    compilationSuccess(path, 'js');
    // console.log('testinfo',testinfo)
    reloadSocket.sendJSUpdate(lastCompiledResources, testinfo);
});
const fileChanged = (path) => __awaiter(void 0, void 0, void 0, function* () {
    if (path.includes('index.js')) {
        yield buildJavascript(path);
        buildSiteSpectInclude(path);
    }
    if (path.includes('.scss')) {
        yield buildSass(path, 'prod');
        yield buildSass(path, 'dev');
        buildSiteSpectInclude(path);
    }
});
const listenToFileChanges = function () {
    const chokidarSettings = {
        ignored: [/.*\/generated\/.*/],
        persistent: true,
        ignoreInitial: false,
        alwaysStat: false,
    };
    const changeWatcher = chokidar.watch(rootDir + '/klanten', chokidarSettings);
    changeWatcher.on('change', fileChanged);
};
const initTool = function () {
    console.log('/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(' * CRO Development 4 life ♡');
    listenToFileChanges(); // Use Chokadir to check for filechanges
    console.log(' * All projects are being watched. Have fun!');
    console.log(' * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */');
    console.log('\n');
};
initTool();
/** Stop process from beeing terminated */
process.stdin.resume();
//# sourceMappingURL=index.js.map