/* deploy commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */
'use strict'
const getProjectName = require('../lib/utils/ci').getProjectName

/**
 * @name mapEnv
 * @description Map environment variables from CI environment to functions config
 * @example <caption>Basic</caption>
 * # make sure you set mapEnv settings in .firebaserc
 * npm i -g firebase-ci
 * firebase-ci mapEnv
 * @example <caption>Travis</caption>
 * after_success:
 *   - npm i -g firebase-ci
 *   - firebase-ci mapEnv
 */
module.exports = function(program) {
  program
    .command('project')
    .description('Get name of project associated with current CI environment')
    .action((directory, options) => {
      const projectKey = getProjectName()
      if (!projectKey) {
        process.exit(1)
      } else {
        console.log(projectKey) // eslint-disable-line no-console
        process.exit(0)
      }
    })
}
