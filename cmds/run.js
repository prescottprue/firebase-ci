/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const runActions = require('../lib/actions').runActions

/**
 * @name deploy
 * @description Deploy to Firebase only on build branches (master, stage, prod)
 * @param {String} only - Only flag can be passed to deploy only specified
 * targets (e.g hosting, storage)
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * npm i -g firebase-ci
 * firebase-ci deploy
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci deploy
 */
module.exports = function (program) {
  program
    .command('run')
    .description('Run all firebase-ci actions based on config (includes copyVersion, copyEnv, and createConfig)')
    .action((directory, options) => {
      runActions(program.args[0])
        .then(() => {
          return process.exit(0)
        })
        .catch((err) => {
          console.error('Error:', err.toString ? err.toString() : err) // eslint-disable-line no-console
          return process.exit(1)
        })
    })
}
