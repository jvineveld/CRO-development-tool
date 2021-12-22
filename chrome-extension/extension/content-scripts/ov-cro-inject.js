/**
 * Here we inject the updated css and js in the webpage
 * 
 * depending on what active tests are stored in localstorage, 
 * it renders or doesn't render the recieved css / js updates
 * 
 * session storage is set from within the dev_tools panel
 * 
 * @author Jonas van Ineveld
 */
class ovCroInject{
	constructor(){
		try {
			this.socket = io('http://localhost:6584',  { query: 'path='+document.location.href, reconnectionAttempts: 1, reconnection: false });
		} catch (error) {
			return;
		}
		this.activeTests = [];
		this.subscribeToSocket();

		this.listenToDevtoolsEvents();

		let lastVal = JSON.parse(sessionStorage.getItem('active_test')),
			hasActiveTests = lastVal ? lastVal : [] ;

		for(let test of hasActiveTests){
			this.activateTest(test)
		}
	}

	listenToDevtoolsEvents(){
		document.addEventListener('CRODevtools_ActivateTest', e => {
			this.activateTest(e.detail)
		}, false);
		 
		document.addEventListener('CRODevtools_DisableTest', e => {
			this.disableTest(e.detail)
		}, false);
	}

	disableTest(test){
		let indexToRemove = null;
		this.activeTests.some((active, index) => {
			if(active.customer===test.customer&&active.test===test.test&&active.variation===test.variation){
				indexToRemove = index;
				return true;
			}
			return false;
		})

		if(indexToRemove!==null){
			this.activeTests.splice(indexToRemove, 1);
		}
		sessionStorage.setItem('active_test', JSON.stringify(this.activeTests));
		document.location.reload();
	}

	activateTest(test){
		if(this.isActiveTest(test)){
			return;
		}

		this.activeTests.push(test)
		sessionStorage.setItem('active_test', JSON.stringify(this.activeTests));

		this.socket.emit('subscribe_to_test', { test })
	}

	isActiveTest(test){
		for(let active of this.activeTests){
			if(active.customer===test.customer&&active.test===test.test&&active.variation===test.variation){
				return true;
			}
		}

		return false;
	}

	subscribeToSocket(){
		this.socket.on('initial_resources', resources => this.initialResources(resources));
		this.socket.on('css_updated', resources => {
			this.updateCss(resources.css, resources.test.test, resources.test.variation)
		});
		this.socket.on('js_updated', () => {
			document.location.reload()
		});
	}

	initialResources(resources){
		if(resources.css){
			this.updateCss(resources.css, resources.test, resources.variation)
		}
		if(resources.js){
			this.updateJs(resources.js, resources.test, resources.variation)
		}
	}

	updateCss(cssString, test, variation){
		let blockKey = 'ov-cro-injected-style-'+test+'-'+variation,
			currentStyleBlock = document.getElementById(blockKey);

		if(currentStyleBlock){
			currentStyleBlock.outerHTML = '<style id="'+blockKey+'">' + cssString + '</style>';

			return;
		}

		let head = document.head,
			style = document.createElement('style');

		style.id = blockKey;
		head.appendChild(style);
		style.appendChild(document.createTextNode(cssString));
	}

	updateJs(jsString, test, variation){

		let blockKey = 'ov-cro-injected-script-'+test+'-'+variation,
			currentScriptBlock = document.getElementById(blockKey);

		if(currentScriptBlock){
			document.location.reload()
		}

		let head = document.head,
			script = document.createElement('script');

		script.id = blockKey;
		head.appendChild(script);
		script.appendChild(document.createTextNode(jsString));
	}
}

document.croInject = new ovCroInject();