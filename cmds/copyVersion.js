/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const copyVersion = require('../lib/index').copyVersion

/**
 * @name copyVersion
 * @description Copy version from main package.json into functions folder package.json
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * npm i -g firebase-ci
 * firebase-ci copyVersion
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci copyVersion
 */
module.exports = function (program) {
  program
    .command('copyVersion')
    .description('Copy version from outer folder into functions folder')
    .action((directory, options) => {
      try {
        copyVersion(program.args[0], directory, options)
        return process.exit(0)
      } catch (err) {
        return process.exit(1)
      }
    })
}
