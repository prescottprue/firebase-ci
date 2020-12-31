/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const createConfig = require('../lib/actions/createConfig').default

/**
 * @name createConfig
 * @description Create src/config.js file (planned to be deprecated)
 * @param {object} program - Commander program object
 */
module.exports = function (program) {
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
        createConfig({ project, path })
        process.exit(0)
      } catch (err) {
        process.exit(1)
      }
    })
}
