<template>
	<a-layout>
      <a-layout-header style="padding:5px 10px;"><appHeader /></a-layout-header>
      <a-layout-header class="active-tests"><activeTests /></a-layout-header>
      <a-layout style="padding:10px; background: #fff;">
        <a-layout-sider width="300" style="background: #fff"><TestSelect /><span class="footnote">By Jonas van Ineveld</span></a-layout-sider>
        <a-layout-content style="background: #fff; padding-left: 20px;"><nuxt /></a-layout-content>
      </a-layout>
    </a-layout>
</template>
<script>
import appHeader from './parts/haeder'
import TestSelect from '~/components/TestSelect';
import activeTests from '~/components/activeTests';
import docCommunicator from '~/services/docCommunicator'
import copyToClipboard from 'copy-to-clipboard';

export default {
	components: {
		appHeader,
		TestSelect,
		activeTests
	},
	data () {
		return {
			polling: null
		}
	},
	methods: {
		pollData () {
			this.polling = setInterval(async () => {
				this.$store.dispatch('fetchActiveTests')
			}, 2000)
			this.$store.dispatch('fetchActiveTests')
		}
	},
	beforeDestroy () {
		clearInterval(this.polling)
	},
	created () {
		this.pollData()
	},
	sockets: {
		got_test_info(info){
			this.testInfo = info.info
			this.$store.commit('newTest',info)
			this.$store.commit('setLoading',false)
		},
		css_file_contents(contents){
			copyToClipboard(contents);
			this.$notification.success({
				message: 'CSS in clipboard geplaatst',
				description: contents.split('\n').length + ' regels',
			});
		},
		js_file_contents(contents){
			copyToClipboard(contents);
			this.$notification.success({
				message: 'JS in clipboard geplaatst',
				description: contents.split('\n').length + ' regels',
			});

		}
	}
}
</script>
<style lang="scss">
html {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;

  min-width: 300px;
}

.footnote{
	position: absolute;
	bottom: 4px;
	font-size: 13px;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #3b8070;
  color: #3b8070;
  text-decoration: none;
  padding: 10px 30px;
}

.button--green:hover {
  color: #fff;
  background-color: #3b8070;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #35495e;
  color: #35495e;
  text-decoration: none;
  padding: 10px 30px;
  margin-left: 15px;
}

.button--grey:hover {
  color: #fff;
  background-color: #35495e;
}

.wrapper{
	padding: 20px;
}

.ant-layout-header
{
	border-bottom: 1px solid #ccc;

	+ div{
		max-height: calc(100vh - 43px);
	}
}

#__nuxt,
#__layout,
.ant-layout
{
	height: 100%;
}

.ant-layout-sider
{
	max-height: calc(100vh - 43px);
	overflow: auto;
	background: #f1f1f1 !important;
	margin: -10px !important;
	padding: 10px;
	border-right: 1px solid #e4e2e2;
}

.ant-layout.ant-layout-has-sider{
	padding: 0;
}

.ant-layout-header.active-tests{
	padding:0;
	border:0;
	background: transparent;
}


@media (max-width: 600px) {
	.ant-layout.ant-layout-has-sider{
		flex-direction: column;

		> .ant-layout-sider{
			height: auto;
			width: auto !important;
			max-width: none !important;
			flex: 0 0 52px !important;
			margin: -10px -10px 10px -10px !important;

			border-bottom: 1px solid #e4e2e2;
		}

		> .ant-layout-content{
			border-right: none;
			padding-left: 0 !important;
		}

		#test-select .ant-menu{
			display: none;
		}
	}

	.active-tests-notice{
		.test-con-info{
			display: none;
		}
	}

}

@media (max-width: 400px) {

	.header .title{
		#OV{
			display: none;
		}
		span{
			margin-left:-80px;
		}
	}
}
</style>
