

// const chrome = typeof chrome !== 'undefined' ? chrome : {
// 	devtools: {
// 		inspectedWindow: {
// 			eval: (evalStr, callback) => {
// 				// console.info('Would eval in inspected window', evalStr)
// 				if(evalStr==='sessionStorage.getItem(\'active_test\')'){
// 					callback('[{"customer":"stedentrips","test":"alternative-design-pdp","variation":false,"stats":{"dev":16777220,"mode":16877,"nlink":5,"uid":501,"gid":20,"rdev":0,"blksize":4096,"ino":4320158190,"size":160,"blocks":0,"atimeMs":1564563907879.6677,"mtimeMs":1563356875102.0085,"ctimeMs":1563356875102.0085,"birthtimeMs":1563355459515.1416,"atime":"2019-07-31T09:05:07.880Z","mtime":"2019-07-17T09:47:55.102Z","ctime":"2019-07-17T09:47:55.102Z","birthtime":"2019-07-17T09:24:19.515Z"}}]');
// 					return;
// 				}
// 				callback(true)
// 			}
// 		}
// 	}
// }

const docCommunicator = {
	async fetchCurrentTabUrl(){
		return new Promise(resolve => {
			chrome.devtools.inspectedWindow.eval('document.location.href', resp => resolve(resp))
		})
	},
	async fetchActiveTests(){
		return new Promise(resolve => {
			chrome.devtools.inspectedWindow.eval('sessionStorage.getItem(\'active_test\')', resp => {
				let val = resp ? JSON.parse(resp) : []
				resolve(val)
			})
		})
	},
	async activateTest(testInfo){
		return new Promise(resolve => {
			const injectedJS = 'document.dispatchEvent(new CustomEvent("CRODevtools_ActivateTest", { detail: '+JSON.stringify(testInfo.info)+' }));';
		
			chrome.devtools.inspectedWindow.eval(injectedJS, resp => resolve(resp))
		})
	},
	async disableTest(testInfo){
		return new Promise(resolve => {
			const injectedJS = 'document.dispatchEvent(new CustomEvent("CRODevtools_DisableTest", { detail: '+JSON.stringify(testInfo.info)+' }));';

			chrome.devtools.inspectedWindow.eval(injectedJS, resp => resolve(resp))
		})
	},
}

export default docCommunicator