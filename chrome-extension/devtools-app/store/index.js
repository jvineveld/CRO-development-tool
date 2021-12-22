import docCommunicator from '~/services/docCommunicator'

export const state = () => ({
	loading: false,
	testInfo: {},
	currentTests: []
})

const testIsActive = function(testinfo, currentTests){
	if(!testinfo.info){
		return testinfo;
	}
	let atest = testinfo.info,
		active = false;

	for(let ctest of currentTests){
		if(ctest.customer===atest.customer && ctest.test===atest.test && ctest.variation===atest.variation){
			active = true;
		}
	}
	testinfo.active = active;

	return testinfo
}
  
export const mutations = {
	setLoading(state, is_loading){
		state.loading = is_loading
	},
	newTest (state, testInfo) {
	  	state.testInfo = testIsActive(testInfo, state.currentTests)
	},
	setCurrentTests (state, currentTests) {
		state.testInfo = testIsActive(state.testInfo, currentTests)
		state.currentTests = currentTests
	}
}

export const actions = {
	async fetchActiveTests (context){
		let currentTests = await docCommunicator.fetchActiveTests()

		context.commit('setCurrentTests', currentTests)
	}
}