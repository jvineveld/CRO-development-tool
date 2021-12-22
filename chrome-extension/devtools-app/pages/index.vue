<template>
	<div>
		kies een project aan de linkerkant
	</div>
</template>

<script>
import Logo from '~/components/Logo.vue'
import TestSelect from '~/components/TestSelect.vue'

export default {
  data(){
	return {
		connected: false,
		projects_tree: []
	}
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
		this.$socket.emit('hello')
	}
}
</script>

<style lang="scss">

</style>
