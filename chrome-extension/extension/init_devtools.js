/** 
 * Add the OrangeValley CRO tab to dev tools
*/

chrome.devtools.panels.create('CRO',
	'assets/logo.png',
	'devtool_tab/index.html',
	function(panel) { 
		/* Panel loaded */
	}
);