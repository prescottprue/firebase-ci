/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const copyEnv = require('../lib/actions/copyEnv').copyEnv

/**
 * @name copyEnv
 * @description Copy version from main package.json into functions folder package.json
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * npm i -g firebase-ci
 * firebase-ci copyEnv
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci copyEnv
 */
module.exports = function (program) {
  program
    .command('copyEnv')
    .description('Copy version from outer folder into functions folder')
    .action((directory, options) => {
      try {
        copyEnv()
        return process.exit(0)
      } catch (err) {
        console.error('Error:', err)
        return process.exit(1)
      }
    })
}
