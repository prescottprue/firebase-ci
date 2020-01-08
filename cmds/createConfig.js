/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */

const createConfig = require('../lib/actions/createConfig').default;

/**
 * @name deploy
 * @description Deploy to Firebase only on build branches (master, stage, prod)
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * # make sure FIREBASE_TOKEN env variable is set
 * npm i -g firebase-ci
 * firebase-ci deploy
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci deploy
 */
module.exports = function createConfigCommand(program) {
  program
    .command('createConfig')
    .description(
      'Build configuration file based on settings in .firebaserc. Uses environment variables to determine project from .firebaserc to use for config (falls back to "default" then to "master").'
    )
    .option(
      '-p, --project [projectName]',
      'Project within .firebaserc to use when creating config file. Defaults to "default" then to "master"'
    )
    .option(
      '--path [pathToConfigFile]',
      'Path to save the config file. Defaults to src/config.js',
      './src/config.js'
    )
    .action(({ path, project }) => {
      try {
        createConfig({ project, path });
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
};
