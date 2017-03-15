/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';
const chalk = require('chalk')
const exec = require('child_process').exec
const program = require('commander')
const deployToFirebase = require('../lib/index')

module.exports = function(program) {
	program
		.command('deploy')
		.version('0.0.0')
		.option('-o --only <targets>', 'Only deploy to specified, comma-seperated targets (e.g "hosting, storage")', /^(hosting|functions|small)$/i)
		.description('Deploy to Firebase only on build branches (master, stage, prod)')
		.action((directory, options) => {
			const { only } = program.args[0]
			deployToFirebase({ only }, (error, stdout) => {
				process.exit(1)
			})
		})
};
