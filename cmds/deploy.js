/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const deployToFirebase = require('../lib/index').deploy

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
    .command('deploy')
    .description('Deploy to Firebase only on build branches (master, stage, prod)')
    .option('-o --only <targets>', 'Only deploy to specified, comma-seperated targets (e.g "hosting, storage")', /^(hosting|functions|small)$/i)
    .action((directory, options) => {
      deployToFirebase(program.args[0])
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
}
