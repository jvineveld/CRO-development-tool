// import Vue from 'vue'
import Router from 'vue-router'

import Homepage from '~/pages/index'

export function createRouter(ssrContext, createDefaultRouter) {
	const defaultRouter = createDefaultRouter(ssrContext)
	return new Router({
	  ...defaultRouter.options,
	  routes: fixRoutes(defaultRouter.options.routes)
	})
}
  
function fixRoutes(defaultRoutes) {
	// default routes that come from `pages/`
	console.log('got some routes', defaultRoutes)
	return [...defaultRoutes, { 
		path: '/index.html',
		component: Homepage
	}]
}