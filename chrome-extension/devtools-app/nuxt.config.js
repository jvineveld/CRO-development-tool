
export default {
	mode: 'spa',

	render: {
		csp: true
	},

	generate: {
		dir: './../extension/devtool_tab',
		csp: true,
		routes: [
			'/'
		]
	},

	router: {
		base: '/devtool_tab/'
	},
	/*
  ** Headers of the page
  */
	head: {
		title: process.env.npm_package_name || '',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
		],
		link: [
			{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
		]
	},
	/*
	** Customize the progress-bar color
	*/
	loading: { color: '#fff' },
	/*
	** Global CSS
	*/
	css: [
		'ant-design-vue/dist/antd.css'
	],
	/*
	** Plugins to load before mounting the App
	*/
	plugins: [
		'@/plugins/antd-ui',
		'@/plugins/socket-io'
	],
	/*
	** Nuxt.js modules
	*/
	modules: [
		'@nuxtjs/router',
		'@nuxtjs/moment',
		// '~/io'
	],
	moment: {
		locales: ['nl']
	},
	routerModule: {
		keepDefaultRouter: true
		/* module options */
	},
	/*
	** Build configuration
	*/
	build: {
		/*
		** You can extend webpack config here
		*/
		extend(config, ctx) {
		}
	}
}
