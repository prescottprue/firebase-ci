const getProjectName = require('../lib/utils/ci').getProjectName;

/**
 * @name project
 * Get name of the firebase project associated with the current CI environment.
 * @param {object} program - Commander program object
 * @example <caption>Basic</caption>
 * echo "Project to deploy to $(firebase-ci project)"
 * // => "Project to deploy to my-project"
 */
module.exports = function projectCommand(program) {
  program
    .command('project')
    .description('Get name of project associated with current CI environment')
    .action((directory, options) => {
      const projectKey = getProjectName();
      if (!projectKey) {
        process.exit(1);
      } else {
        console.log(projectKey); // eslint-disable-line no-console
        process.exit(0);
      }
    });
};
