/**
 * This file will start a watcher on the /klanten/ folder
 * when a change has been found in a file, it will try to compile the assats with babel
 * and create a bundled file
 *
 * use the chrome plugin for hot reloading current page with css and js inject
 *
 * @author Jonas van Ineveld
*/

import chokidar from 'chokidar'
import { rootDir, getFile, getInfoFromPath, ensureExists, stripWorkDir, getProjectFolder, currentConfig } from './helpers.js'
import { OutputOptions, rollup } from 'rollup';
import { string } from 'rollup-plugin-string';
import modify from 'rollup-plugin-modify';
import { babel, RollupBabelInputPluginOptions } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import sass from 'node-sass';
import { Options as SASS_Options } from 'node-sass';
import nodeResolve from 'rollup-plugin-node-resolve';
import fs from 'fs';
import path from 'path';
import moment from 'moment'
import autoprefixer from 'autoprefixer'
import postcss from 'postcss'

// const cliSpinners = require('cli-spinners');
import ora from 'ora';
import chalk from 'chalk';

import { liveReload } from './live-reload-server.js';
import { terser } from 'rollup-plugin-terser';
import prettier from 'rollup-plugin-prettier';
import json from 'rollup-plugin-json';
// const {rollupExtractConfig} = require('./rollup-extract-config');

const defaultBrowserTarget = currentConfig.browserTarget

interface BabelOptionsObj {
	browserTarget?: string,
	longParse?: boolean
}

interface BundleOptionsObj {
	babelOptions?: BabelOptionsObj,
	preventMinify?: boolean
}

const babelOptions = (env = 'dev', babelOptions: BabelOptionsObj): RollupBabelInputPluginOptions => {
	let config : RollupBabelInputPluginOptions = {
		// 'runtimeHelpers': true,
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
	}

	if(env==='prod'){
		config.plugins.push(['transform-remove-console', {'exclude': [ 'error', 'warn']}]);
	}

	return config;
}

const bundleOptions = (env='dev', bundleOptions: BundleOptionsObj) => {
	const bundlerModules = [
		babel(babelOptions(env, bundleOptions.babelOptions)), 	// transpile ESX TO ES5
		nodeResolve(), 											// Resolve node modules
		commonjs(),												// common things?
		string({												// support for including .html files as import
			include: '**/*.html',
		}),
		json(),													// support for including .json files as import
		// rollupExtractConfig()
	]

	if(env==='dev'){
		bundlerModules.push(prettier({							// runs prettier on dev script so it's readable for humans
			parser: 'babel',
			useTabs: true,
			singleQuote: true,
		}));
	}
	if(env==='prod'){
		bundlerModules.push(modify({							// replaces tabs with nothing. Tabs should not be used for important thing, and creates strange bugs (white spaces)
			find: '\\t',
			replace: ''
		}));

		if(!bundleOptions.preventMinify){
			bundlerModules.push(terser({
				mangle: false
			}));							// minify and uglify the code so it's smaller
		}

	}

	return bundlerModules
}

// to keep track of last generated resources to push to websocket,
// we store it here. So this is for when compiling JS, also sending the latest css with it
const lastCompiledResources = {
	css: '',
	js: ''
}

const getResource = async function(path){
	try {
		if (fs.existsSync(path)) {
			return new Promise((resolve, reject) => {
				fs.readFile(path, 'utf8', function(err, contents) {
					if(err){
						reject(err);
						return;
					}
					resolve(contents)
				});
			}).catch(err => {
				console.error(err)
			})
		}
	} catch(err) {
		console.error(err)
	}

	return false;
}

const requestTestFiles = async function(test){
	let testDir = path.join(rootDir, currentConfig.rootDir, test.customer, test.test, ( test.variation ? test.variation : '' )),
		cssDevPath = path.join(testDir,'generated', 'dev', 'output.css'),
		jsDevPath = path.join(testDir,'generated','dev', 'output.js')

	// console.log({test, testDir, cssDevPath, jsDevPath})
	let css = await getResource(cssDevPath),
		js = await getResource(jsDevPath);

	return { css, js };
}

const reloadSocket = new liveReload(requestTestFiles);

interface BuildBundleExtraSettings {
	browserList: string,
	parser: string,
	nominify: boolean
}

const buildBundle = async function(targetPath: string, type = 'dev', extraSettings: BuildBundleExtraSettings){
	let bundleSetting: BundleOptionsObj = {
		babelOptions: {}
	};

	if(extraSettings){
		if(extraSettings.browserList){
			// shoudl do shings
			bundleSetting.babelOptions.browserTarget = extraSettings.browserList;
		}

		if(extraSettings.parser){
			// shoudl do shings
			bundleSetting.babelOptions.longParse = true;
		}

		if(extraSettings.nominify){
			bundleSetting.preventMinify = true;
		}
	}

	let bundlePlugins = bundleOptions(type, bundleSetting);

	let bundle = await rollup({
		input: targetPath,
		plugins: bundlePlugins,
		output: {
			intro: '/* Compiled: ' + moment().format('DD-MM-YYYY HH:mm:ss') + ' */'
		}
	});

	let projectFolder = targetPath.substring(0, targetPath.lastIndexOf('/')),
		bundleWriteOutputOptions: OutputOptions = {
			file: path.join(projectFolder, 'generated', type, 'output.js'),
			format: 'iife',
			intro: `
/**
* CRO Development
* Compiled: ` + moment().format('DD-MM-YYYY HH:mm:ss') + `
**/
`
		},
		bundleWriteOptions = {
			sourceMap: 'inline',
			strict : false,
			'runtimeHelpers': false,
			plugins: bundlePlugins,
			output: bundleWriteOutputOptions
		};

	switch(type){
	case 'dev':
		bundleWriteOptions.sourceMap = 'inline'
		break;
	case 'prod':
		break;
	}

	let output = await bundle.write(bundleWriteOutputOptions);

	if(output.output[0].code){

		let codeWithComment = output.output[0].code.replace(/\n$/g, '') + '\n/* Compiled: ' + moment().format('DD-MM-YYYY HH:mm:ss') + ' */';

		fs.writeFileSync(bundleWriteOptions.output.file, codeWithComment);
	}

	return output;
}

const compilationSuccess = function(file: string, type){
	let time = moment().format('HH:mm:ss')
	console.log(chalk.white(chalk.bgGreenBright.black(' Nice! ') + ' ' + chalk.bgWhite.black(' '+ time+ ' ') + ' ' + chalk.bgWhite.black(' '+type+' ') + ' ' + stripWorkDir(file)));
}

const buildHTMLfile = (changedFilePath) => {
	let projectFolder = getProjectFolder(changedFilePath);

	const devJs = getFile(path.join(projectFolder, 'generated', 'dev', 'output.js')),
		devStyle = getFile(path.join(projectFolder, 'generated', 'dev', 'output.css')),
		prodJs = getFile(path.join(projectFolder, 'generated', 'prod', 'output.js')),
		prodStyle = getFile(path.join(projectFolder, 'generated', 'prod', 'output.css')),
		devOutFile = path.join(projectFolder, 'generated', 'dev', 'output.html'),
		prodOutFile = path.join(projectFolder, 'generated', 'prod','output.html');

	let prodCode = '',
		devCode = '';

	if(devStyle){
		devCode += `<style>
${devStyle}
</style>`
	}

	if(devJs){
		devCode += `
<script>
${devJs}
</script>`
	}

	if(devStyle){
		prodCode += `<style>
${prodStyle}
</style>`
	}

	if(devJs){
		prodCode += `
<script>
${prodJs}
</script>
		`
	}
	
	fs.writeFile(devOutFile, devCode, function(error){
		if(error){
			console.log('error in html file generation:', error)
		}
	});

	fs.writeFile(prodOutFile, prodCode, function(error){
		if(error){
			console.log('error in html file generation:', error)
		}
	});
}

const buildSass = async (targetPath, type = 'dev') => {
	let projectFolder = getProjectFolder(targetPath),
		buildOptions: SASS_Options = {
			file: path.join(projectFolder, 'index.scss'),
			outFile: null,
			outputStyle: 'compact',
			sourceMap: false
		}

	if(!targetPath.includes('.scss', '.sass')){
		return;
	}

	const spinner = ora({text:'CSS '+type, interval: 10}).start();

	switch(type){
	case 'dev':
		buildOptions.outFile = path.join(projectFolder, 'generated', 'dev', 'output.css');
		buildOptions.outputStyle = 'compact';
		buildOptions.sourceMap = false;
		break;
	case 'prod':
		buildOptions.outFile = path.join(projectFolder, 'generated', 'prod', 'output.css')
		buildOptions.outputStyle = 'compact';

		break;
	}

	let buildFolder = buildOptions.outFile.substring(0, buildOptions.outFile.lastIndexOf('/'));

	await new Promise((res, rej) => {
		ensureExists(buildFolder, false, err => err ? rej(err) : res(true))
	});
	let cssResult = null;
	let result = await new Promise((res, rej) => {
		try {
			// console.log('shloud be', buildOptions)
			sass.render(buildOptions, (error, result) => {
				// console.log(error, result);
				if(!error){
					try {
						cssResult = result.css.toString().replace(/^\n/gm, '')

						if(type==='prod'){
							postcss([ autoprefixer({ overrideBrowserslist: 'last 3 versions' }) ]).process(cssResult, { map: false, from: undefined }).then(result => {
								result.warnings().forEach(warn => {
									console.warn(warn.toString())
								})

								// No errors during the compilation, write this result on the disk
								fs.writeFile(buildOptions.outFile, result.css, function(err){
									if(err){ rej(err) }

									res(true)
								});
							})
						} else {
							// No errors during the compilation, write this result on the disk+
							
							fs.writeFile(buildOptions.outFile, result.css.toString().replace(/^\n/gm, ''), function(err){
								if(err){ rej(err) }

								if(!result.map){
									res(true)
								}
							});

							if(result.map){
								fs.writeFile(buildOptions.outFile+'.map', result.map, function(err){
									if(err){ rej(err) }
									res(true)
								});
							}
						}


					}
					catch(error) {
						console.error(error);
						// expected output: ReferenceError: nonExistentFunction is not defined
						// Note - error messages will vary depending on browser
					}
				} else {
					console.log('\nFile: '+error.file);
					console.log('Line: '+ error.line +':' + error.column + ' :: ' + error.message);
				}
			});
		} catch (error) {
			console.error(error)
			rej(error)
		}

		spinner.stop()

	});

	if(result){
		spinner.stop();
		compilationSuccess(buildOptions.outFile, 'css');
		lastCompiledResources.css = cssResult.toString();
		let testinfo = await getInfoFromPath(targetPath)

		// console.log('sending path info', testinfo)

		reloadSocket.sendCSSUpdate(lastCompiledResources.css, testinfo)
	}

	spinner.stop();
}

const buildJavascript = async targetPath => {
	if(!targetPath.includes('.js')){
		return;
	}

	const spinner = ora({text:'Bundeling & transpiling JS prod', interval: 10}).start();

	let testinfo = await getInfoFromPath(targetPath)

	try {
		await buildBundle(targetPath, 'prod', testinfo.js.headers).catch(err => {
			console.error(err)
			throw new Error('Error transpiling');
		})
		// console.log('result', bundleresult)
	} catch (error) {
		spinner.stop();
		console.log('\n\n' + error)
		return;
	}

	spinner.text = 'Bundeling & transpiling JS dev';
	let devJSBundle = {
		output: []
	}
	try {
		devJSBundle = await buildBundle(targetPath, 'dev', testinfo.js.headers).catch(err => {
			console.error(err)
			throw new Error('Error transpiling ');
		})
	} catch (error) {
		spinner.stop();
		console.log('\n\n' + error)
		return;
	}

	lastCompiledResources.js = devJSBundle.output[0].code;
	spinner.stop();
	compilationSuccess(targetPath, 'js');


	// console.log('testinfo',testinfo)
	reloadSocket.sendJSUpdate(lastCompiledResources, testinfo)
}

const fileChanged = async (path: string) => {
	if(path.includes('index.js')){
		await buildJavascript(path)

		buildHTMLfile(path)
	}

	if(path.includes('.scss')){
		await buildSass(path, 'prod')

		await buildSass(path, 'dev')

		buildHTMLfile(path)
	}
}

const listenToFileChanges = function(){
	const chokidarSettings = {
		ignored: [/.*\/generated\/.*/],
		persistent: true,
		ignoreInitial: false,
		alwaysStat: false,
	}

	const changeWatcher = chokidar.watch(path.join(rootDir,currentConfig.rootDir), chokidarSettings);
	changeWatcher.on('change', fileChanged)
}

const initTool = function(){
	console.log('/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
	console.log(' * CRO Development 4 life ♡');
	listenToFileChanges(); // Use Chokadir to check for filechanges
	console.log(' * All projects are being watched. Have fun!')
	console.log(' * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */');
	console.log('\n')
}

initTool();

/** Stop process from beeing terminated */
process.stdin.resume();

