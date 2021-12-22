<template>
	<div>
		<div v-if="loading">
			<Loading />
		</div>
		<div v-if="!loading">
			<a-button
				class="a-start-stop"
				v-if="!testInfo.active"
				@click="startTest"
				><a-icon type="check-circle" /> Test starten</a-button
			>
			<a-button
				class="a-start-stop"
				v-if="testInfo.active"
				type="danger"
				@click="stopTest"
				><a-icon type="stop" /> Test stoppen</a-button
			>
			<h2 class="customer">
				{{ testInfo.info.customer.replace(/-/g, ' ') }}
			</h2>

			<div v-if="testInfo.info.stats.exists !== false">
				<div style="margin: 0 0 20px;">
					<div v-if="testInfo.info.js">
						<h3
							v-if="
								testInfo.info.js.headers &&
									testInfo.info.js.headers.test
							"
						>
							{{ testInfo.info.js.headers.test }}
						</h3>
						<h3
							v-if="
								!testInfo.info.js.headers ||
									!testInfo.info.js.headers.test
							"
						>
							{{ testInfo.info.test.replace(/-/g, ' ') }}
							<span v-if="testInfo.info.variation">
								<a-icon type="right" />
								{{ testInfo.info.variation.replace(/-/g, ' ') }}
							</span>
						</h3>
						<p
							v-if="
								testInfo.info.js.headers &&
									testInfo.info.js.headers.desc
							"
						>
							{{ testInfo.info.js.headers.desc }}
						</p>
						<a-button
							type="dashed"
							v-if="
								testInfo.info.js.headers &&
									testInfo.info.js.headers.url
							"
							@click="() => toUrl(testInfo.info.js.headers.url)"
							><a-icon type="copy" />
							{{ testInfo.info.js.headers.url }}</a-button
						>
					</div>
					<h3 v-if="!testInfo.info.js">
						{{ testInfo.info.test }}
						<span v-if="testInfo.info.variation">
							<a-icon type="right" />
							{{ testInfo.info.variation }}
						</span>
					</h3>
				</div>

				<div class="file-stats">
					<div class="js-stats" v-if="testInfo.info.js">
						<a-button class="a-copy" type="dashed" @click="copyJS"
							><a-icon type="copy" /> clipboard</a-button
						>
						<h3>Javascript</h3>
						<strong>Aangemaakt op:</strong>
						{{
							$moment(
								testInfo.info.js.prodInfo.birthtime
							).fromNow()
						}}
						<br />
						<strong>Laatst bewerkt:</strong>
						{{
							$moment(testInfo.info.js.prodInfo.mtime).fromNow()
						}}
						<br />
						<strong>Grootte:</strong>
						{{ testInfo.info.js.prodInfo.size }} bytes ({{
							testInfo.info.js.prodInfo.size / 1000
						}}
						kb)
					</div>
					<div class="css-stats" v-if="testInfo.info.css">
						<a-button class="a-copy" type="dashed" @click="copyCSS"
							><a-icon type="copy" /> clipboard</a-button
						>
						<h3>CSS</h3>
						<strong>Aangemaakt op:</strong>
						{{
							$moment(
								testInfo.info.css.prodInfo.birthtime
							).fromNow()
						}}
						<br />
						<strong>Laatst bewerkt:</strong>
						{{
							$moment(testInfo.info.css.prodInfo.mtime).fromNow()
						}}
						<br />
						<strong>Grootte:</strong>
						{{ testInfo.info.css.prodInfo.size }} bytes ({{
							testInfo.info.css.prodInfo.size / 1000
						}}
						kb)
					</div>
				</div>
			</div>
			<div v-if="testInfo.info.stats.exists === false">
				<a-alert
					message="Test niet gevonden"
					description="De server kan de test niet vinden. Klopt het pad naar de test wel?"
					type="error"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import Loading from '~/components/Loading.vue';
import docCommunicator from '~/services/docCommunicator';
import copyToClipboard from 'copy-to-clipboard';

export default {
	computed: {
		testInfo() {
			console.log('testfds', this.$store.state.testInfo);
			return this.$store.state.testInfo;
		},
		loading() {
			return this.$store.state.loading;
		},
		currentTests() {
			return this.$store.state.currentTests;
		},
	},
	components: {
		Loading,
	},
	created() {
		let testPath = this.$route.params.pathMatch;
		this.$store.commit('setLoading', true);

		this.$socket.emit('get_test_info', { testPath });
	},
	methods: {
		async startTest() {
			let activated = await docCommunicator.activateTest(this.testInfo);

			setTimeout(() => this.$store.dispatch('fetchActiveTests'), 20);
		},
		stopTest() {
			let stopped = docCommunicator.disableTest(this.testInfo);

			setTimeout(() => this.$store.dispatch('fetchActiveTests'), 20);
		},
		async copyJS() {
			this.$socket.emit('fetch_prod_js_content', { test: this.testInfo });
		},
		async copyCSS() {
			this.$socket.emit('fetch_prod_css_content', {
				test: this.testInfo,
			});
		},
		async toUrl(url) {
			copyToClipboard(url);

			this.$notification.success({
				message: 'URL in clipboard geplaatst',
			});
		},
	},
};
</script>

<style lang="scss">
.customer {
	font-size: 16px;
	margin: 4px 0 18px;
	text-transform: capitalize;

	.anticon {
		font-size: 14px;
	}
}

.file-stats {
	margin: 30px 0;

	> div {
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 15px 10px 10px;
		position: relative;

		> h3 {
			position: absolute;
			top: -14px;
			left: 15px;
			background: #fff;
			padding: 0 10px;
		}

		+ div {
			margin-top: 30px;
		}
	}
}

.a-copy {
	float: right;
}

.a-start-stop {
	float: right;
}
</style>
