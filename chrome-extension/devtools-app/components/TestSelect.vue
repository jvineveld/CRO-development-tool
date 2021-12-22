<template>
<div id="test-select">
	<a-select defaultValue="" placeholder="Selecteer project" style="width: 240px; margin-bottom:10px;" @change="handleChange">
		<a-select-opt-group v-for="customer of dataSource" v-bind:key="customer.customer">
			<span slot="label">{{customer.customer}}</span>
			<template v-for="test in customer.tests">
				<a-select-option v-if="test.variations.length===0" :value="customer.customer + '/' + test.test" :key="customer.customer + '/' + test.test">
					{{test.test.replace(/-/g, ' ')}}
				</a-select-option>
				<a-select-option v-for="variation of test.variations" :value="customer.customer + '/' + test.test + '/' + variation" :key="customer.customer+'/'+test.test+'/'+variation">
					{{test.test.replace(/-/g, ' ') + ' > ' + variation.replace(/-/g, ' ')}}
				</a-select-option>
			</template>
		</a-select-opt-group>
  	</a-select>
	
	<a-button @click="refresh" shape="circle" icon="reload" />
	 <a-menu
    @click="handleClick"
    style="width: 100%"
    :defaultSelectedKeys="[]"
    :openKeys.sync="openKeys"
    mode="inline"
  >
    <a-sub-menu @titleClick="titleClick"  v-for="customer in projects_tree" v-bind:key="customer.customer">
      <span slot="title"><span><a-icon type="folder" /> {{customer.customer.replace(/-/g, ' ')}}</span></span>
	  <!-- <div v-if="customer.tests"> -->
	<a-sub-menu  v-for="test in customer.tests" v-bind:key="test.test">
        <template slot="title"><span><a-icon type="folder" /> {{test.test.replace(/-/g, ' ')}}</span></template>
		<!-- <div v-if="test.variations"> -->
			<a-menu-item v-if="!test.variations.length" v-bind:key="customer.customer+'/'+test.test">
			
			  <nuxt-link v-bind:to="'/test/' + customer.customer+'/'+test.test+'/'"><a-icon type="code" /> {{test.test.replace(/-/g, ' ')}}</nuxt-link>

			</a-menu-item>

        	<a-menu-item v-for="variation in test.variations" v-bind:key="customer.customer+'/'+test.test+'/'+variation">
			
			  <nuxt-link v-bind:to="'/test/' + customer.customer+'/'+test.test+'/'+variation"><a-icon type="code" /> {{variation.replace(/-/g, ' ')}}</nuxt-link>

			</a-menu-item>
			
		<!-- </div> -->
      </a-sub-menu>
	  <!-- </div> -->
    </a-sub-menu>
  </a-menu>
</div>
</template>

<script>

export default {
	data(){
		return {
			dataSource: [],
			openKeys: [],
			connected: false,
			projects_tree: []
		}
	},
	sockets: {
		connect() {
			console.log('socket connected')
			this.connected = true;
		},
		disconnect() {
			console.log('socket disconnected')
			this.connected = false;
		},
		projects_tree(val) {
			console.log('projects_tree', val)
			this.projects_tree = val;

			let options = [];

			for(let customer of val){
				for(let test of customer.tests){

					if(!test.variations.length){
						options.push(customer.customer + ' > ' + test.test);
						continue;
					}
					for(let variation of test.variations){
						options.push(customer.customer + ' > ' + test.test + ' > ' + variation);
					}
				}
			}

			this.dataSource = val
		},
		available_tests(available_tests){
			console.log('available_tests', available_tests)
		}
	},
	created: function(){
		this.$socket.emit('get_projects_tree')
		},
	methods: {
		handleChange (path){
			console.log('change', path)
			this.$router.push('/test/' + path)
		},
		handleClick (e) {
			console.log('click', e)
		},
		handleSelect (e) {
			console.log('select', e)
		},
		titleClick (e) {
			console.log('titleClick', e)
		},
		filterOption(input, option) {
			console.log(input, option)
			return true;
			// return option.componentOptions.children[0].text.toUpperCase().indexOf(input.toUpperCase()) >= 0
		},
		refresh(){
			console.log('request projects tree', this.$socket)
			this.$socket.emit('get_projects_tree')
		}
	},
	watch: {
		openKeys (val) {
			console.log('openKeys', val)
		},
	},
}
</script>

<style lang="scss">
#test-select{
	width: 100%;

	.ant-input{
		margin-bottom: 10px;
	}
}
.ant-menu-submenu-title{
	line-height: 25px !important;
	height: 25px !important;
	padding-left: 10px !important;

}

[aria-expanded="true"] > span{
	font-weight: 500;
}
.ant-menu-sub{

	.ant-menu-submenu-title{
		padding-left: 20px !important;

	}
}

.ant-menu-item
{
	padding-left: 30px !important;
	line-height: 35px !important;
	height: 35px !important;
}
</style>
