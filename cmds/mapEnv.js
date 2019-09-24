const mapEnv = require('../lib/index').mapEnv;

/**
 * @name mapEnv
 * Map environment variables from CI environment to functions config
 * @param {object} program - Commander program
 * @example <caption>Basic</caption>
 * # make sure you set mapEnv settings in .firebaserc
 * npm i -g firebase-ci
 * firebase-ci mapEnv
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci mapEnv
 */
module.exports = function mapEnvCommand(program) {
  program
    .command('mapEnv')
    .description('Copy version from outer folder into functions folder')
    .action((directory, options) => {
      return mapEnv(program.args[0])
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
