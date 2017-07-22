/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const createConfig = require('../lib/actions').createConfig

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
    .command('createConfig')
    .description('Build configuration file based on settings in .firebaserc')
    .action((directory, options) => {
      try {
        createConfig(program.args[0], directory, options)
        return process.exit(0)
      } catch (err) {
        console.error('Error:', err)
        return process.exit(1)
      }
    })
}
