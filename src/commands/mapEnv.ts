/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const mapEnv = require('../lib/actions/mapEnv').default

/**
 * @name mapEnv
 * Map environment variables from CI environment to functions config
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * # make sure you set mapEnv settings in .firebaserc
 * firebase-ci mapEnv
 */
module.exports = function(program) {
  program
    .command('mapEnv')
    .description('Copy version from outer folder into functions folder')
    .action((directory, options) => {
      return mapEnv(program.args[0])
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
}
