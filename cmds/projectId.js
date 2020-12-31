'use strict'
const getProjectId = require('../lib/utils/ci').getProjectId

/**
 * @name project
 * Get name of the firebase project associated with the current CI environment.
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * echo "Project to deploy to $(firebase-ci project)"
 * // => "Project to deploy to my-project"
 */
module.exports = function (program) {
  program
    .command('projectId')
    .description('Get projectId of associated with current CI environment')
    .option(
      '-d, --default-env <envName>',
      'Default environment (used in place of master)'
    )
    .action((directory, options) => {
      const defaultProject = directory && directory.defaultEnv
      const projectKey = getProjectId(defaultProject && { defaultProject })
      if (!projectKey) {
        process.exit(1)
      } else {
        console.log(projectKey) // eslint-disable-line no-console
        process.exit(0)
      }
    })
}
