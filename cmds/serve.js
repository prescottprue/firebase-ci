/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const serve = require('../lib/actions/serve').default

/**
 * @name serve
 * Serve project using project matching associated branch
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * firebase-ci deploy
 */
module.exports = function (program) {
  program
    .command('serve')
    .description(
      'Use firebase serve to serve a project matching branch name settings in .firebaserc'
    )
    .option('-d --debug', 'Enable extra logging') // taken by autocmdr
    .option(
      '-o --only <targets>',
      'Only serve specified targets, comma-seperated (e.g "hosting, storage")'
    )
    .action((opts) => {
      return serve(opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
}
