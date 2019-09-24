const runActions = require('../lib/index').runActions;

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
module.exports = function runCommand(program) {
  program
    .command('run')
    .description(
      'Run all firebase-ci actions based on config (includes copyVersion, copyEnv, and createConfig)'
    )
    .action((directory, options) => {
      return runActions(program.args[0])
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
