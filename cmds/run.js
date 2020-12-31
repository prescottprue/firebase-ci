/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const runActions = require('../lib/actions/deploy').runActions

/**
 * @name deploy
 * Deploy to Firebase only on build branches (master, stage, prod)
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * firebase-ci deploy
 */
module.exports = function (program) {
  program
    .command('run')
    .description(
      'Run all firebase-ci actions based on config (includes copyVersion, copyEnv, and createConfig)'
    )
    .action((directory, options) => {
      runActions(program.args[0])
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
}
