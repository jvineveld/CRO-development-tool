var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchEntryPoints, rootDir, currentConfig, getInfoFromPath, createTestId, getFile, getTestPath } from './helpers.js';
import path from 'path';
import { createServer } from "http";
import { Server } from "socket.io";
export class liveReload {
    constructor(requestTestFiles) {
        this.activeTests = [];
        this.urls = [];
        this.url_info = [];
        this.requestTestFiles = null;
        this.subscribers = {};
        this.requestTestFiles = requestTestFiles;
        const httpServer = createServer();
        this.server = new Server(httpServer, {});
        this.server.on("connection", (socket) => this.newConnection(socket));
        httpServer.listen(6584);
    }
    createSocketHandlers(socket) {
        socket.on('hello', () => {
            socket.emit('hello');
        });
        socket.on('get_projects_tree', () => {
            socket.emit('projects_tree', fetchEntryPoints());
        });
        socket.on('get_test_info', (data) => __awaiter(this, void 0, void 0, function* () {
            let path = data.testPath, info = yield getInfoFromPath(path.join(rootDir, currentConfig.rootDir, path));
            setTimeout(() => socket.emit('got_test_info', { info }), 400);
        }));
        socket.on('subscribe_to_test', ({ test }) => {
            this.addSubscriber(test, socket.id);
        });
        socket.on('fetch_prod_css_content', ({ test }) => {
            let cssFile = path.join(getTestPath(test.info), 'generated', 'prod', 'output.css');
            socket.emit('css_file_contents', getFile(cssFile));
        });
        socket.on('fetch_prod_js_content', ({ test }) => {
            let jsFile = path.join(getTestPath(test.info), 'generated', 'prod', 'output.js');
            socket.emit('js_file_contents', getFile(jsFile));
        });
        socket.on('disconnect', socket => {
            this.removeSubscriber(socket.id);
        });
    }
    addSubscriber(test, socketId) {
        let testId = createTestId(test);
        if (!this.subscribers[testId]) {
            this.subscribers[testId] = [];
        }
        this.subscribers[testId].push(socketId);
        this.sendInitialUpdate(socketId, test);
    }
    removeSubscriber(socketId) {
        let activeTests = Object.keys(this.subscribers);
        for (let testId of activeTests) {
            this.subscribers[testId] = this.subscribers[testId].filter(subSocketId => subSocketId !== socketId);
        }
    }
    disconnectHandler(index) {
        this.activeTests = this.activeTests.splice(index, 1);
    }
    activateTest(test, socket) {
        let newLenth = this.activeTests.push(Object.assign(Object.assign({}, test), { id: socket.id }));
        socket.on('disconnect', () => {
            this.disconnectHandler(newLenth - 1);
        });
        this.sendInitialUpdate(socket.id, test);
    }
    toggleTest(testToActivate) {
    }
    testIsActive(testInfo) {
        let testId = createTestId(testInfo);
        if (this.subscribers[testId]) {
            return this.subscribers[testId].length ? this.subscribers[testId] : false;
        }
        return false;
    }
    newConnection(socket) {
        try {
            let request_url = socket.request._query.path;
            this.createSocketHandlers(socket);
            if (request_url === 'devtools') {
                let points = fetchEntryPoints();
                socket.emit('projects_tree', points);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    sendInitialUpdate(socket_id, test) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.requestTestFiles(test);
            this.server.to(socket_id).emit('initial_resources', Object.assign(Object.assign({}, data), { customer: test.customer, test: test.test, variation: test.variation }));
        });
    }
    sendCSSUpdate(css, testInfo) {
        const activeTests = this.testIsActive(testInfo);
        if (!activeTests) {
            return;
        }
        for (let activeTest of activeTests) {
            this.server.to(activeTest).emit('css_updated', { css, test: testInfo });
        }
    }
    sendJSUpdate(js, testInfo) {
        const activeTests = this.testIsActive(testInfo);
        if (!activeTests) {
            return;
        }
        for (let activeTest of activeTests) {
            this.server.to(activeTest).emit('js_updated', js);
        }
    }
}
