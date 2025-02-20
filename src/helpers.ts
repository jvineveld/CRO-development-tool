/**
 * Helper methods
 *
 * @author Jonas van Ineveld
 */
import { readdirSync } from 'fs';
import path from 'path';
import fs from 'fs';

export const rootDir = path.resolve();

interface CustomConfig {
	"browserTarget": string,
	"rootDir": string
}

const getConfig = () : CustomConfig => {
	const defaultConfig: CustomConfig = {
		"browserTarget": "Edge >=12 and > 0% in alt-EU, Firefox >= 30 and > 0% in alt-EU, Chrome >= 30 and > 0% in alt-EU, Safari >= 7.1 and > 0% in alt-EU, ios_saf >= 6.0 and > 0% in alt-EU, last 1 and_ff version and > 0% in alt-EU, last 1 and_chr versions and > 0% in alt-EU, samsung >= 8.2 and > 0% in alt-EU, android >= 4.2 and > 0% in alt-EU",
		"rootDir": "customers"
	}

	const configFile = path.join(path.resolve(), 'config.json')
	if(!fs.existsSync(configFile)){
		return defaultConfig
	}

	return {...defaultConfig, ...JSON.parse(fs.readFileSync(configFile, 'utf8')) }
}

export const currentConfig = getConfig()

// creates a unique identifier for the test so it can be organized and indexed
export const createTestId = test => {
	return test.customer+'_'+test.test+(test.variation ? '_'+test.variation : '')
}

export const getTestPath = test => {
	return path.join(rootDir, currentConfig.rootDir,test.customer,test.test,(test.variation ? '/'+test.variation : ''))
}

export const stripWorkDir = (source: string) => {
	return source.replace(rootDir, '').replace('/'+currentConfig.rootDir, '')
}

export const getFile = (targetPath: string) => {
	if(!fs.existsSync(targetPath)){
		return false;	
	}

	return fs.readFileSync(targetPath, 'utf8');
}

const getDirectories = function(source) : string[] {
	return readdirSync(source, { withFileTypes: true })
	.filter(dirent => dirent.isDirectory())
	.map(dirent => dirent.name);
}
	

export function fetchEntryPoints() {
	let customers = getDirectories('./'+currentConfig.rootDir);

	return customers.map(customer => {
		let tests = getDirectories(path.join(rootDir, currentConfig.rootDir, customer));

		return { 
			customer, 
			tests: tests.map(test => {
				let variations = getDirectories(path.join(rootDir, currentConfig.rootDir, customer, test));

				variations = variations.filter(name => name !== 'generated')

				return { test, variations }
			}) 
		}
	});
};

export function getProjects() {
	return getDirectories('./'+currentConfig.rootDir);
};

// from https://gist.github.com/jadaradix/fd1ef195af87f6890448
let getLines = async function getLines (filename, lineCount) : Promise<string[]> {
	return new Promise((resolve, reject) => {
		let stream = fs.createReadStream(filename, {
			flags: 'r',
			encoding: 'utf-8',
			fd: null,
			mode: 438, // 0666 in Octal
			// bufferSize: 64 * 1024,
		});

		let data = '';
		let lines = [];
		stream.on('data', function (moreData) {
			data += moreData;
			lines = data.split('\n');
			// probably that last line is "corrupt" - halfway read - why > not >=
			if (lines.length > lineCount + 1) {
				stream.destroy();
				lines = lines.slice(0, lineCount); // junk as above
				resolve(lines);
			}
		});
	
		stream.on('error', function (e) {
			reject(e);
		});

		stream.on('end', function () {
			resolve(lines);
		});
	})
};
  

const getCommentHeaders = async (targetPath: string) => {
	if(!fs.existsSync(targetPath)){
		return {};	
	}
	let lines = await getLines(targetPath, 20),
		headers = {};

	for(let line of lines){
		let match = line.match(/\@(test|desc|author|url|parser|browserList|nominify)((.|\n)*?$)/);
		if(match && match.length >= 2){
			let tag = match[1].trim(),
				val = match[2].trim();

			headers[tag] = val
		}
	}

	return headers;
}

const getFileInfo = async (targetPath) => {
	if(!fs.existsSync(targetPath)){
		return false;	
	}

	let stats = fs.statSync(targetPath)

	return stats;
}

const getCssJsResourceInfo = async (targetPath: string) => {
	let basePath = targetPath.replace('index.js', '').replace('index.scss', '')
	return {
		css: {
			headers: await getCommentHeaders(path.join(basePath, 'index.scss')),
			prodInfo: await getFileInfo(path.join(basePath, 'generated', 'prod', 'output.css'))
		}, 
		js: {
			headers: await getCommentHeaders(path.join(basePath, 'index.js')),
			prodInfo: await getFileInfo(path.join(basePath, 'generated', 'prod', 'output.js'))
		}
	}
}
export const getInfoFromPath = async function(targetPath: string, withFileInfo = false){
	let testPath = targetPath.replace(path.join(rootDir,currentConfig.rootDir), ''),
		pathParts = testPath.split('/'),
		variation : boolean | string = false

	if(pathParts[3] && !pathParts[3].includes('.')){
		variation = pathParts[3];
	}

	let returnVal = {
		'customer': pathParts[1],
		'test': pathParts[2],
		'variation': typeof variation === 'string' ? variation.replace(/includes$/, '') : variation,
		'stats': null,
		'js': {
			'headers': null
		}
	}

	if(!withFileInfo){
		if(fs.existsSync(targetPath)){
			returnVal = { 
				...returnVal, 
				...await getCssJsResourceInfo(targetPath),
				stats: await getFileInfo(targetPath)
			}
		} else {
			returnVal.stats = {
				exists: false
			}
		}
	}
	
	return returnVal
}

export const ensureExists = function(path: string, mask, cb) {
	if (typeof mask == 'function') { // allow the `mask` parameter to be optional
		cb = mask;
		mask = '0777';
	}
	fs.mkdir(path, { recursive: true }, function(err) {
		if (err) {
			if (err.code == 'EEXIST') {cb(null);} // ignore the error if the folder already exists
			else {cb(err);} // something else went wrong
		} else {cb(null);} // successfully created folder
	});
}

export function getProjectFolder(path){
	return path.substring(0, path.lastIndexOf('/')).replace(/includes$/, '')
}

