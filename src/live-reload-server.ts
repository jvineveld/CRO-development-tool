/**
 * Om onze testen nog sneller te developen een klein servertje wat een socket start
 * Als je de chrome plugin installeert, krijg je live injectie / reload van je CRO test code.
 *
 * @author Jonas van Ineveld
 */
// server
import { fetchEntryPoints, rootDir, stripWorkDir, getInfoFromPath, createTestId, getFile, getTestPath } from './helpers.js';
import { createServer } from "http";
import { Server, Socket } from "socket.io";

export class liveReload {
	activeTests = []
	urls = []
	url_info = []
	requestTestFiles = null
	subscribers = {}
	server: Server

	constructor(requestTestFiles) {
		this.requestTestFiles = requestTestFiles;

		const httpServer = createServer();
		this.server = new Server(httpServer, { /* optional settings */ });
		this.server.on("connection", (socket: Socket) => this.newConnection(socket));

		httpServer.listen(6584);
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
