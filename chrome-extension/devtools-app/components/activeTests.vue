<template>
	<div class="active-tests-notice" v-if="currentTests.length > 0">
		<span class="test-con-info"><a-icon type="rocket" /> Actieve test{{currentTests.length > 1 ? 'en' : ''}}</span>
		
		<div>
			<div v-for="test of currentTests" v-bind:key="test.variation+test.test" class="">
				<nuxt-link v-bind:to="'/test/' + test.customer+'/'+test.test+(test.variation ? '/' + test.variation : '')"><a-icon type="code" /> {{test.customer}} / {{test.test}} {{test.variation ? ' / ' + test.variation : ''}} </nuxt-link>
			</div>
		</div>
	</div>
</template>

<script>

export default {
	data(){
		return {
			
		}
	},
	computed: {
		currentTests () {
			return this.$store.state.currentTests
		},
	},
 
}
</script>

<style lang="scss">
.test-con-info{
    font-weight: 500;
    color: #fff;
    border: 1px solid;
    padding: 1px 5px;
    font-size: 12px;
    border-radius: 3px;
    line-height: 1.7em;
}
.active-tests-notice{
	background: #6da26d;
	color: #fff;
	padding: 5px 10px;
	font-size: 12px;
	line-height: 17px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	text-shadow: 1px 1px 1px rgba(0,0,0,.3);

	a{
		color: inherit;
	}
}
</style>
