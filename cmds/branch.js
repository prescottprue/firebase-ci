'use strict'
const getBranch = require('../lib/utils/ci').getBranch

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
    .command('branch')
    .description(
      'Get name of the branch associated with current CI environment'
    )
    .action((directory, options) => {
      const projectKey = getBranch()
      if (!projectKey) {
        process.exit(1)
      } else {
        console.log(projectKey) // eslint-disable-line no-console
        process.exit(0)
      }
    })
}
