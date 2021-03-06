/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const deployToFirebase = require('../lib/actions/deploy').default

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
    .command('deploy')
    .description(
      'Deploy to Firebase only on build branches with matching project settings in .firebaserc'
    )
    .option('-d --debug', 'Enable extra logging') // taken by autocmdr
    .option('-i --info', 'Extra Info from installs')
    .option(
      '-f --force',
      'delete Cloud Functions missing from the current working directory without confirmation'
    )
    .option(
      '--except <targets>',
      'deploy to all targets except specified (e.g. "database")'
    )
    .option(
      '-o --only <targets>',
      'Only deploy to specified, comma-seperated targets (e.g "hosting, storage")'
    )
    .option('-s --simple', 'Skip CI actions, and only run deployment')
    // .option('-a --actions <actions>', 'Only run certain CI actions (e.g "mapEnv", "createConfig")', /^(mapEnv|createConfig|copyVersion)$/i)
    .action((opts) => {
      return deployToFirebase(opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
}
