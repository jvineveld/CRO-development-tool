import Vue from 'vue'

import VueSocketio from 'vue-socket.io-extended';
import io from 'socket.io-client';
 
Vue.use(VueSocketio, io('http://localhost:6584',  { query: 'path='+'devtools' }));