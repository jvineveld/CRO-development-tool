<template>
	<div class="header">
		<h1 class="title">
			<span>CRO Development</span>
		</h1>
		<span class="con-info is-con" v-if="connected"><a-icon type="api" /> Connected to VSCode</span>
		<span class="con-info not-cont" v-if="!connected"><a-icon type="api" /> Not connected</span>
	</div>
</template>

<script>
import Logo from '~/components/Logo.vue'
import TestSelect from '~/components/TestSelect.vue'
import docCommunicator from '~/services/docCommunicator';

export default {
	data(){
		return {
			connected: false,
			projects_tree: []
		}
	},
	computed: {
		currentTests () {
			return this.$store.state.currentTests
		},
	},
	components: {
		Logo,
		TestSelect
	},
	sockets: {
		connect() {
			this.connected = true;
		},
		hello() {
			this.connected = true;
		},
		disconnect() {
			this.connected = false;
		}
  },
  methods: {
  },
  created: function(){
		docCommunicator.fetchCurrentTabUrl().then(url => console.log('got URL', url))
		this.$socket.emit('hello')
	}
}
</script>

<style lang="scss">
.ant-layout-header{
	height: auto;
	line-height: 1.6em;
	background: #f1f1f1;
}
.header{
	position: relative;

	h1{
		margin: 0;
	}

	.con-info{
		position: absolute;
		right: 0;
		top: 4px;
		font-weight: 500;
		color: #333;
		border: 1px solid;
		display: inline-block;
		padding: 1px 5px;
		font-size: 12px;
		border-radius: 3px;
		line-height: 1.7em;

		&.is-con{
			color: green;
		}

		&.not-cont{
			color: red;
		}
	}
}

@keyframes OVin {
	from {
		opacity: 0;
		transform: translate(-50px, 0);
	}
	to {
		opacity: 1;
		transform: translate(0px, 0);
	}
}

@keyframes OVLogoin {
	from {
		opacity: 0;
		transform: scale(0.8) translate(20px, 0);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 16px;
  color: #35495e;
  letter-spacing: 1px;
  line-height: 1em;

  svg{
	  width: 100px;
	  height: 22px;
	  position: relative;
	  bottom: -5px;
		vertical-align: middle;
	  #OV{
		  opacity: 0;
		  transform: translate(-50px, 0);
		  animation: OVin .5s forwards;
	  }

		#logo{
			opacity: 0;
			animation: OVLogoin .5s forwards;
			animation-delay: .1s;
		}
  }

  span{
	  vertical-align: top;
	   opacity: 0;
		  transform: translate(-50px, 0);
		  animation: OVin .5s forwards;
			animation-delay: .5s;
			display: inline-block;
		line-height: 32px;
		font-weight: 500;
		margin-left: 10px;
  }
}
</style>
