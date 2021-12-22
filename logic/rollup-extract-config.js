/**
 * This rollup plugin will extract the 'moduleConfig' object, put it non minified at the top.
 * This way it's easy to configure, also for production builds.
 *   
 * @returns rollup plugin
 */
exports.rollupExtractConfig = function() {
	return {
		name: 'rollup-extract-config', // this name will show up in warnings and errors
		buildEnd( error ) {
			if(error){
				console.error('error passed to custom plugin', error)
				return;
			}
			console.log(this)
		},
		resolveId ( source ) {
			if (source === 'virtual-module') {
				return source; // this signals that rollup should not ask other plugins or check the file system to find this id
			}
			return null; // other ids should be handled as usually
		},
		load ( id ) {
			if (id === 'virtual-module') {
				return 'export default "This is virtual!"'; // the source code for "virtual-module"
			}
			return null; // other ids should be handled as usually
		}
	};
}
  