const deployToFirebase = require('../lib/index').deploy;

/**
 * @name deploy
 * Deploy to Firebase only on build branches (master, stage, prod)
 * @param {object} program - Commander program
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * npm i -g firebase-ci
 * firebase-ci deploy
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci deploy
 */
module.exports = function deployCommand(program) {
  program
    .command('deploy')
    .description(
      'Deploy to Firebase only on build branches (master, stage, prod)'
    )
    .option('-d --debug', 'Enable extra logging') // taken by autocmdr
    .option('-i --info', 'Extra Info from installs')
    .option(
      '-o --only <targets>',
      'Only deploy to specified, comma-seperated targets (e.g "hosting, storage")'
    )
    .option('-s --simple', 'Skip CI actions, and only run deployment')
    // .option('-a --actions <actions>', 'Only run certain CI actions (e.g "mapEnv", "createConfig")', /^(mapEnv|createConfig|copyVersion)$/i)
    .action(opts => {
      return deployToFirebase(opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
