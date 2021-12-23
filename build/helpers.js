var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readdirSync } from 'fs';
import path from 'path';
import fs from 'fs';
export const rootDir = path.resolve();
const getConfig = () => {
    const defaultConfig = {
        "browserTarget": "Edge >=12 and > 0% in alt-EU, Firefox >= 30 and > 0% in alt-EU, Chrome >= 30 and > 0% in alt-EU, Safari >= 7.1 and > 0% in alt-EU, ios_saf >= 6.0 and > 0% in alt-EU, last 1 and_ff version and > 0% in alt-EU, last 1 and_chr versions and > 0% in alt-EU, samsung >= 8.2 and > 0% in alt-EU, android >= 4.2 and > 0% in alt-EU",
        "rootDir": "customers"
    };
    const configFile = path.join(path.resolve(), 'config.json');
    if (!fs.existsSync(configFile)) {
        return defaultConfig;
    }
    return Object.assign(Object.assign({}, defaultConfig), JSON.parse(fs.readFileSync(configFile, 'utf8')));
};
export const currentConfig = getConfig();
export const createTestId = test => {
    return test.customer + '_' + test.test + (test.variation ? '_' + test.variation : '');
};
export const getTestPath = test => {
    return path.join(rootDir, currentConfig.rootDir, test.customer, test.test, (test.variation ? '/' + test.variation : ''));
};
export const stripWorkDir = (source) => {
    return source.replace(rootDir, '').replace('/' + currentConfig.rootDir, '');
};
export const getFile = (targetPath) => {
    if (!fs.existsSync(targetPath)) {
        return false;
    }
    return fs.readFileSync(targetPath, 'utf8');
};
const getDirectories = function (source) {
    return readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
};
export function fetchEntryPoints() {
    let customers = getDirectories('./' + currentConfig.rootDir);
    return customers.map(customer => {
        let tests = getDirectories(path.join(rootDir, currentConfig.rootDir, customer));
        return {
            customer,
            tests: tests.map(test => {
                let variations = getDirectories(path.join(rootDir, currentConfig.rootDir, customer, test));
                variations = variations.filter(name => name !== 'generated');
                return { test, variations };
            })
        };
    });
}
;
export function getProjects() {
    return getDirectories('./' + currentConfig.rootDir);
}
;
let getLines = function getLines(filename, lineCount) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let stream = fs.createReadStream(filename, {
                flags: 'r',
                encoding: 'utf-8',
                fd: null,
                mode: 438,
            });
            let data = '';
            let lines = [];
            stream.on('data', function (moreData) {
                data += moreData;
                lines = data.split('\n');
                if (lines.length > lineCount + 1) {
                    stream.destroy();
                    lines = lines.slice(0, lineCount);
                    resolve(lines);
                }
            });
            stream.on('error', function (e) {
                reject(e);
            });
            stream.on('end', function () {
                resolve(lines);
            });
        });
    });
};
const getCommentHeaders = (targetPath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs.existsSync(targetPath)) {
        return {};
    }
    let lines = yield getLines(targetPath, 20), headers = {};
    for (let line of lines) {
        let match = line.match(/\@(test|desc|author|url|parser|browserList|nominify)((.|\n)*?$)/);
        if (match && match.length >= 2) {
            let tag = match[1].trim(), val = match[2].trim();
            headers[tag] = val;
        }
    }
    return headers;
});
const getFileInfo = (targetPath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs.existsSync(targetPath)) {
        return false;
    }
    let stats = fs.statSync(targetPath);
    return stats;
});
const getCssJsResourceInfo = (targetPath) => __awaiter(void 0, void 0, void 0, function* () {
    let basePath = targetPath.replace('index.js', '').replace('index.scss', '');
    return {
        css: {
            headers: yield getCommentHeaders(path.join(basePath, 'index.scss')),
            prodInfo: yield getFileInfo(path.join(basePath, 'generated', 'prod', 'output.css'))
        },
        js: {
            headers: yield getCommentHeaders(path.join(basePath, 'index.js')),
            prodInfo: yield getFileInfo(path.join(basePath, 'generated', 'prod', 'output.js'))
        }
    };
});
export const getInfoFromPath = function (targetPath, withFileInfo = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let testPath = targetPath.replace(rootDir + '/klanten/', ''), pathParts = testPath.split('/'), variation = false;
        if (pathParts[2] && !pathParts[2].includes('.')) {
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
        };
        if (!withFileInfo) {
            if (fs.existsSync(targetPath)) {
                returnVal = Object.assign(Object.assign(Object.assign({}, returnVal), yield getCssJsResourceInfo(targetPath)), { stats: yield getFileInfo(targetPath) });
            }
            else {
                returnVal.stats = {
                    exists: false
                };
            }
        }
        return returnVal;
    });
};
export const ensureExists = function (path, mask, cb) {
    if (typeof mask == 'function') {
        cb = mask;
        mask = '0777';
    }
    fs.mkdir(path, { recursive: true }, function (err) {
        if (err) {
            if (err.code == 'EEXIST') {
                cb(null);
            }
            else {
                cb(err);
            }
        }
        else {
            cb(null);
        }
    });
};
export function getProjectFolder(path) {
    return path.substring(0, path.lastIndexOf('/')).replace(/includes$/, '');
}
