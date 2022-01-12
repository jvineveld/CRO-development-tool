/**
 * after installation, assist to create config file and folder, and first project with some msg how to begin.
 * 
 * @author Jonas van Ineveld
 */

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

async function writeConfigFile(fileLoc, config){
	return new Promise(res => {
		try {
			let data = JSON.stringify({
				"browserTarget": config.browser_target,
				"rootDir": config.project_folder_name
			}, null, '\t');
			fs.writeFileSync(fileLoc, data);
			res(1)
		} catch (error) {
			console.error('Error writing config file!', error)
			res(1)
		}
	})
}

async function createExampleCampaign(exampleDir){
	return new Promise(res => {
		fs.mkdirSync(exampleDir, { recursive: true })
		fs.writeFileSync(path.join(exampleDir, 'index.scss'), `body{
	background: blue !important;
}`)
		fs.writeFileSync(path.join(exampleDir, 'index.js'), `function initTest(){
	alert('It worked!')
}

initTest()`)
		res(1)
	})
}

async function postInstall(){
	console.log("\n" + 'Installing CRO Development Tool' + "\n")

	const help = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'help_setting_up',
			message: "Want help setting up project?",
		},
	]);

	if(!help.help_setting_up){
		return;
	}

	var extraNote = ''

	const projectConfig = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'add_scripts_to_packagejson',
			message: "Should start & help scripts be added to your package.json?",
		},
		{
			type: 'input',
			name: 'project_folder_name',
			message: "What should the main project folder name be?",
			default: 'customers'
		},
		{
			type: 'input',
			name: 'browser_target',
			message: "What should the default browser target be?",
			default: '> 0.5%, last 2 versions, Firefox ESR, not dead'
		},
		{
			type: 'confirm',
			name: 'create_example_campaigns',
			message: "Create example campaigns and structure?",
		},
	]);

	const configFile = path.join(path.resolve(), 'config.json')

	if(fs.existsSync(configFile)){
		const overWrite = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'overwrite',
				message: "An existing config file was found, should this be overwritten? (config.json)"
			}
		]);

		if(overWrite.overwrite){
			await writeConfigFile(configFile, projectConfig)
		}
	} else {
		await writeConfigFile(configFile, projectConfig)
	}

	const projectFolder = path.join(path.resolve(), projectConfig.project_folder_name)

	if(!fs.existsSync(projectFolder)){
		// create folder
		fs.mkdirSync(projectFolder);
	}

	if(projectConfig.create_example_campaigns){
		await createExampleCampaign(path.join(projectFolder, 'customer', 'some-campaign', 'variation-1'))
		await createExampleCampaign(path.join(projectFolder, 'customer', 'some-campaign', 'variation-2'))
		await createExampleCampaign(path.join(projectFolder, 'customer', 'some-other-campaign', 'variation-1'))
		await createExampleCampaign(path.join(projectFolder, 'customer', 'some-other-campaign', 'variation-2'))
		await createExampleCampaign(path.join(projectFolder, 'another-customer', 'some-campaign', 'variation-1'))
		await createExampleCampaign(path.join(projectFolder, 'another-customer', 'some-campaign', 'variation-2'))
		await createExampleCampaign(path.join(projectFolder, 'another-customer', 'some-other-campaign', 'variation-1'))
		await createExampleCampaign(path.join(projectFolder, 'another-customer', 'some-other-campaign', 'variation-2'))
	}

	var scriptKey = 'start'

	if(projectConfig.add_scripts_to_packagejson){
		try {
			const pkgJsonPath = path.join(path.resolve(), 'package.json')
			const pkgJson = fs.readFileSync(pkgJsonPath, { encoding: 'utf8' })
			const data = JSON.parse(pkgJson)

			const startScriptLine = 'node ' + path.join('node_modules', 'cro-development-tool', 'build', 'index.js')
			
			if(data.scripts.start && data.scripts.start !== startScriptLine){
				extraNote += 'Prevented adding to start script since there is already a start script defined in your package.json' + "\n"
				extraNote += 'Current start script: ' + data.scripts.start + "\n"

				if(!data.scripts['start-server']){
					extraNote += 'It has been added as "start-server" instead of "start"' + "\n"
					extraNote += 'So to start the server, do "npm run start-server, instead of npm start"' + "\n"
					extraNote += 'Or replace the current "start" script with the "start-server" call' + "\n"
					scriptKey = 'start-server'
					
					data.scripts[scriptKey] = startScriptLine
				} else {
					extraNote += 'Please add the following script manually to your package.json' + "\n\n"
					extraNote += '"start": "'+startScriptLine+'"' + "\n"
				}
			} else {
				data.scripts[scriptKey] = startScriptLine
			}
			
			const newData = JSON.stringify(data, null, '\t')
			fs.writeFileSync(pkgJsonPath, newData)
		} catch (error) {
			console.error('Error updating package.json', error)
		}


	}

	console.log('')
	console.log('')
	console.log('WhoopWhoop! Almost there!')
	console.log('')
	if(projectConfig.create_example_campaigns){
		console.log(`A new customer and project has been created in your "${projectConfig.project_folder_name}" directory.`)
	}
	console.log(`Start the development server by running: 'npm ${scriptKey}', and open the extension in your devtools to activate the project for development.`)
	console.log('Happy CRO development!')
	console.log('')
	console.log('If there is anything you would like implemented or working differently, create an issue on https://github.com/jvineveld/CRO-development-tool')

	if(extraNote!==''){
		console.log('')
		console.log('##### WARNING! ######')
		console.log('')

		console.log(extraNote)
	}
}

postInstall()