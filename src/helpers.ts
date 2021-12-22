/**
 * Helper methods
 *
 * @author Jonas van Ineveld
 */
import { readdirSync } from 'fs';
import path from 'path';
import fs from 'fs';

export const rootDir = path.resolve();

// creates a unique identifier for the test so it can be organized and indexed
export const createTestId = test => {
	return test.customer+'_'+test.test+(test.variation ? '_'+test.variation : '')
}

export const getTestPath = test => {
	return rootDir + '/klanten/' + test.customer+'/'+test.test+(test.variation ? '/'+test.variation : '')
}

export const stripWorkDir = source => {
	return source.replace(rootDir, '').replace('/klanten', '')
}

export const getFile = path => {
	if(!fs.existsSync(path)){
		return false;	
	}

	return fs.readFileSync(path, 'utf8');
}

const getDirectories = function(source) : string[] {
	return readdirSync(source, { withFileTypes: true })
	.filter(dirent => dirent.isDirectory())
	.map(dirent => dirent.name);
}
	

export function fetchEntryPoints() {
	let customers = getDirectories('./klanten');

	return customers.map(customer => {
		let tests = getDirectories(rootDir + '/klanten/' + customer);

		return { 
			customer, 
			tests: tests.map(test => {
				let variations = getDirectories(rootDir + '/klanten/' + customer + '/' + test);

				variations = variations.filter(name => name !== 'generated')

				return { test, variations }
			}) 
		}
	});
};

export function getProjects() {
	return getDirectories('./klanten');
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
  

const getCommentHeaders = async path => {
	if(!fs.existsSync(path)){
		return {};	
	}
	let lines = await getLines(path, 20),
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

const getFileInfo = async (path) => {
	if(!fs.existsSync(path)){
		return false;	
	}

	let stats = fs.statSync(path)

	return stats;
}

const getCssJsResourceInfo = async path => {
	let basePath = path.replace('index.js', '').replace('index.scss', '')
	return {
		css: {
			headers: await getCommentHeaders(basePath + '/index.scss'),
			prodInfo: await getFileInfo(basePath + '/generated/prod/output.css')
		}, 
		js: {
			headers: await getCommentHeaders(basePath + '/index.js'),
			prodInfo: await getFileInfo(basePath + '/generated/prod/output.js')
		}
	}
}
export const getInfoFromPath = async function(path, withFileInfo = false){
	let testPath = path.replace(rootDir+ '/klanten/', ''),
		pathParts = testPath.split('/'),
		variation : boolean | string = false

	if(pathParts[2] && !pathParts[2].includes('.')){
		variation = pathParts[2];
	}

	let returnVal = {
		'customer': pathParts[0],
		'test': pathParts[1],
		'variation': typeof variation === 'string' ? variation.replace(/includes$/, '') : variation,
		'stats': null,
		'js': {
			'headers': null
		}
	}

	if(!withFileInfo){
		if(fs.existsSync(path)){
			returnVal = { 
				...returnVal, 
				...await getCssJsResourceInfo(path),
				stats: await getFileInfo(path)
			}
		} else {
			returnVal.stats = {
				exists: false
			}
		}
	}
	
	return returnVal
}

export const ensureExists = function(path, mask, cb) {
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

