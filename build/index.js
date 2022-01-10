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
import { rootDir, getFile, getInfoFromPath, ensureExists, stripWorkDir, getProjectFolder, currentConfig } from './helpers.js';
import { rollup } from 'rollup';
import { string } from 'rollup-plugin-string';
import modify from 'rollup-plugin-modify';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import sass from 'node-sass';
import nodeResolve from 'rollup-plugin-node-resolve';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import ora from 'ora';
import chalk from 'chalk';
import { liveReload } from './live-reload-server.js';
import { terser } from 'rollup-plugin-terser';
import prettier from 'rollup-plugin-prettier';
import json from 'rollup-plugin-json';
const defaultBrowserTarget = currentConfig.browserTarget;
const babelOptions = (env = 'dev', babelOptions) => {
    let config = {
        babelHelpers: 'runtime',
        'presets': [
            ['@babel/preset-env', {
                    'targets': {
                        browsers: babelOptions.browserTarget ? babelOptions.browserTarget : defaultBrowserTarget,
                    },
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
    if (env === 'prod') {
        config.plugins.push(['transform-remove-console', { 'exclude': ['error', 'warn'] }]);
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
        json(),
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
            }));
        }
    }
    return bundlerModules;
};
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
        let testDir = path.join(rootDir, currentConfig.rootDir, test.customer, test.test, (test.variation ? test.variation : '')), cssDevPath = path.join(testDir, 'generated', 'dev', 'output.css'), jsDevPath = path.join(testDir, 'generated', 'dev', 'output.js');
        let css = yield getResource(cssDevPath), js = yield getResource(jsDevPath);
        return { css, js };
    });
};
const reloadSocket = new liveReload(requestTestFiles);
const buildBundle = function (targetPath, type = 'dev', extraSettings) {
    return __awaiter(this, void 0, void 0, function* () {
        let bundleSetting = {
            babelOptions: {}
        };
        if (extraSettings) {
            if (extraSettings.browserList) {
                bundleSetting.babelOptions.browserTarget = extraSettings.browserList;
            }
            if (extraSettings.parser) {
                bundleSetting.babelOptions.longParse = true;
            }
            if (extraSettings.nominify) {
                bundleSetting.preventMinify = true;
            }
        }
        let bundlePlugins = bundleOptions(type, bundleSetting);
        let bundle = yield rollup({
            input: targetPath,
            plugins: bundlePlugins,
            output: {
                intro: '/* Compiled: ' + moment().format('DD-MM-YYYY HH:mm:ss') + ' */'
            }
        });
        let projectFolder = targetPath.substring(0, targetPath.lastIndexOf('/')), bundleWriteOutputOptions = {
            file: path.join(projectFolder, 'generated', type, 'output.js'),
            format: 'iife',
            intro: `
/**
* CRO Development
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
                break;
            case 'prod':
                break;
        }
        let output = yield bundle.write(bundleWriteOutputOptions);
        if (output.output[0].code) {
            let codeWithComment = output.output[0].code.replace(/\n$/g, '') + '\n/* Compiled: ' + moment().format('DD-MM-YYYY HH:mm:ss') + ' */';
            fs.writeFileSync(bundleWriteOptions.output.file, codeWithComment);
        }
        return output;
    });
};
const compilationSuccess = function (file, type) {
    let time = moment().format('HH:mm:ss');
    console.log(chalk.white(chalk.bgGreenBright.black(' Nice! ') + ' ' + chalk.bgWhite.black(' ' + time + ' ') + ' ' + chalk.bgWhite.black(' ' + type + ' ') + ' ' + stripWorkDir(file)));
};
const buildHTMLfile = (changedFilePath) => {
    let projectFolder = getProjectFolder(changedFilePath);
    const devJs = getFile(path.join(projectFolder, 'generated', 'dev', 'output.js')), devStyle = getFile(path.join(projectFolder, 'generated', 'dev', 'output.css')), prodJs = getFile(path.join(projectFolder, 'generated', 'prod', 'output.js')), prodStyle = getFile(path.join(projectFolder, 'generated', 'prod', 'output.css')), devOutFile = path.join(projectFolder, 'generated', 'dev', 'output.html'), prodOutFile = path.join(projectFolder, 'generated', 'prod', 'output.html');
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
            console.log('error in html file generation:', error);
        }
    });
    fs.writeFile(prodOutFile, prodCode, function (error) {
        if (error) {
            console.log('error in html file generation:', error);
        }
    });
};
const buildSass = (targetPath, type = 'dev') => __awaiter(void 0, void 0, void 0, function* () {
    let projectFolder = getProjectFolder(targetPath), buildOptions = {
        file: path.join(projectFolder, 'index.scss'),
        outFile: null,
        outputStyle: 'compact',
        sourceMap: false
    };
    if (!targetPath.includes('.scss', '.sass')) {
        return;
    }
    const spinner = ora({ text: 'CSS ' + type, interval: 10 }).start();
    switch (type) {
        case 'dev':
            buildOptions.outFile = path.join(projectFolder, 'generated', 'dev', 'output.css');
            buildOptions.outputStyle = 'compact';
            buildOptions.sourceMap = false;
            break;
        case 'prod':
            buildOptions.outFile = path.join(projectFolder, 'generated', 'prod', 'output.css');
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
            sass.render(buildOptions, (error, result) => {
                if (!error) {
                    try {
                        cssResult = result.css.toString().replace(/^\n/gm, '');
                        if (type === 'prod') {
                            postcss([autoprefixer({ overrideBrowserslist: 'last 3 versions' })]).process(cssResult, { map: false, from: undefined }).then(result => {
                                result.warnings().forEach(warn => {
                                    console.warn(warn.toString());
                                });
                                fs.writeFile(buildOptions.outFile, result.css, function (err) {
                                    if (err) {
                                        rej(err);
                                    }
                                    res(true);
                                });
                            });
                        }
                        else {
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
        let testinfo = yield getInfoFromPath(targetPath);
        reloadSocket.sendCSSUpdate(lastCompiledResources.css, testinfo);
    }
    spinner.stop();
});
const buildJavascript = (targetPath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!targetPath.includes('.js')) {
        return;
    }
    const spinner = ora({ text: 'Bundeling & transpiling JS prod', interval: 10 }).start();
    let testinfo = yield getInfoFromPath(targetPath);
    try {
        yield buildBundle(targetPath, 'prod', testinfo.js.headers).catch(err => {
            console.error(err);
            throw new Error('Error transpiling');
        });
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
        devJSBundle = yield buildBundle(targetPath, 'dev', testinfo.js.headers).catch(err => {
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
    compilationSuccess(targetPath, 'js');
    reloadSocket.sendJSUpdate(lastCompiledResources, testinfo);
});
const fileChanged = (path) => __awaiter(void 0, void 0, void 0, function* () {
    if (path.includes('index.js')) {
        yield buildJavascript(path);
        buildHTMLfile(path);
    }
    if (path.includes('.scss')) {
        yield buildSass(path, 'prod');
        yield buildSass(path, 'dev');
        buildHTMLfile(path);
    }
});
const listenToFileChanges = function () {
    const chokidarSettings = {
        ignored: [/.*\/generated\/.*/],
        persistent: true,
        ignoreInitial: false,
        alwaysStat: false,
    };
    const changeWatcher = chokidar.watch(path.join(rootDir, currentConfig.rootDir), chokidarSettings);
    changeWatcher.on('change', fileChanged);
};
const initTool = function () {
    console.log('/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(' * CRO Development 4 life ♡');
    listenToFileChanges();
    console.log(' * All projects are being watched. Have fun!');
    console.log(' * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */');
    console.log('\n');
};
initTool();
process.stdin.resume();
