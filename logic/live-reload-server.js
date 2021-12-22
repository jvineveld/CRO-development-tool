/**
 * Om onze testen nog sneller te developen een klein servertje wat een socket start
 * Als je de chrome plugin installeert, krijg je live injectie / reload van je CRO test code.
 *
 * @author Jonas van Ineveld
 */
// server
const io = require('socket.io');
const { urlConfig, fetchEntryPoints, rootDir, stripWorkDir, getInfoFromPath, createTestId, getFile, getTestPath } = require('./helpers');
const _ = require('lodash');

class liveReload {
	constructor(requestTestFiles) {
		this.activeTests = [];
		this.urls = []; // will hold all the urls to match on
		this.url_info = []; // will hold url > test info based on array indes
		this.requestTestFiles = requestTestFiles;
		this.subscribers = {};
		this.createTestUrlsIndex(urlConfig)

		this.server = io.listen(6584);
		this.server.on('connection', socket => this.newConnection(socket));
	}

	createSocketHandlers(socket){
		socket.on('hello', () => {
			socket.emit('hello')
		});
		socket.on('get_projects_tree', () => {
			socket.emit('projects_tree', fetchEntryPoints())
		});
		socket.on('get_test_info', async data => {
			let path = data.testPath,
				info = await getInfoFromPath(rootDir + '/klanten/'+path);

			setTimeout(() => socket.emit('got_test_info', { info }), 400);
		})
		socket.on('subscribe_to_test', ({ test }) => {
			this.addSubscriber(test, socket.id)
		})
		socket.on('fetch_prod_css_content', ({test}) => {
			let cssFile = getTestPath(test.info) + '/generated/prod/output.css'
			
			socket.emit('css_file_contents', getFile(cssFile));
		})
		socket.on('fetch_prod_js_content', ({test}) => {
			let jsFile = getTestPath(test.info) + '/generated/prod/output.js'
			
			socket.emit('js_file_contents', getFile(jsFile));
		})
		socket.on('disconnect', socket => {
			this.removeSubscriber(socket.id)
		})
	}

	addSubscriber(test, socketId){
		let testId = createTestId(test)
		
		if(! this.subscribers[testId]){
			this.subscribers[testId] = []
		}

		this.subscribers[testId].push(socketId)
		this.sendInitialUpdate(socketId, test)
	}

	removeSubscriber(socketId){
		let activeTests = Object.keys(this.subscribers);

		for(let testId of activeTests){
			this.subscribers[testId] = this.subscribers[testId].filter(subSocketId => subSocketId!==socketId)
		}
	}

	disconnectHandler(index){
		this.activeTests = this.activeTests.splice(index,1)
	}

	activateTest(test, socket){
		let newLenth = this.activeTests.push({ ...test, id: socket.id });
		socket.on('disconnect', () => {
			this.disconnectHandler(newLenth-1)
		});
		this.sendInitialUpdate(socket.id, test)
	}

	toggleTest(testToActivate){
		// console.log('cooowl', testToActivate)
	}

	testIsActive(testInfo){
		// console.log('checking if test is active', testInfo)
		let testId = createTestId(testInfo)

		if(this.subscribers[testId]){
			// console.log('found subscribers', this.subscribers)
			return this.subscribers[testId].length ? this.subscribers[testId] : false
		}

		// console.log('no subscribers', testId)

		return false;
	}

	newConnection(socket){
		try {
			let request_url = socket.request._query.path

			this.createSocketHandlers(socket);

			if(request_url==='devtools'){
				let points = fetchEntryPoints();
				socket.emit('projects_tree', points);
			}
			
		} catch (error) {
			console.error(error);
		}
	}

	insertToUrlIndex(url, customer, test, variation = false){
		this.urls.push(url)
		this.url_info.push({customer, test, variation})
	}

	createTestUrlsIndex(config){
		try {
			for(let customer in config){
				for(let test in config[customer]){
					let urls = config[customer][test];
					if(typeof urls === 'string'){
						this.insertToUrlIndex(urls, customer, test);
					} else if (typeof urls.variaties !== 'undefined') {
						for(let variation of urls.variaties){
							// console.log('gaat  goed')
							this.insertToUrlIndex(urls.url, customer, test, variation);
						}
					} else {
						for(let url of urls){
							this.insertToUrlIndex(url, customer, test);
						}
					}
				}
			}
		} catch (error) {
			console.log(error)
		}
	}

	async sendInitialUpdate(socket_id, test) {
		let data = await this.requestTestFiles(test)

		// console.log('sending update!', data)
		// console.log('sending initial files', test);

		this.server.to(socket_id).emit('initial_resources', { ...data, customer: test.customer, test: test.test, variation: test.variation });
	}

	sendCSSUpdate(css, testInfo){
		const activeTests = this.testIsActive(testInfo);

		if(!activeTests){
			return;
		}

		for(let activeTest of activeTests){
			// console.log('updating client', activeTest.id)
			this.server.to(activeTest).emit('css_updated', { css, test: testInfo });
		}
	}

	sendJSUpdate(js, testInfo){
		const activeTests = this.testIsActive(testInfo);

		if(!activeTests){
			return;
		}

		// console.log('sending js updates', testInfo)

		for(let activeTest of activeTests){
			this.server.to(activeTest).emit('js_updated', js);
		}
	}
}

exports.liveReload = liveReload;
