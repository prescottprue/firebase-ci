'use strict'
const setEnv = require('../lib/actions/setEnv').default

/**
 * @name setEnv
 * Map environment variables from CI environment to functions config
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * # make sure you set mapEnv settings in .firebaserc
 * firebase-ci mapEnv
 */
module.exports = function (program) {
  program
    .command('setEnv')
    .description('Set environment variables from settings within .firebaserc')
    .action((directory, options) => {
      return setEnv(program.args[0])
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
}
