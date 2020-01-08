/* eslint-disable no-param-reassign */
module.exports = function loadAllCommands(client) {
  process.env.FORCE_COLOR = true;

  /**
   * Load command based on file name
   *
   * @param {string} name - Name of command
   * @returns {any} Command
   */
  function loadCommand(name) {
    return require(`./${name}`)(client); // eslint-disable-line global-require, import/no-dynamic-require
  }

  client.deploy = loadCommand('deploy');
  client.createConfig = loadCommand('createConfig');
  client.copyVersion = loadCommand('copyVersion');
  client.mapEnv = loadCommand('mapEnv');
  client.run = loadCommand('run');
  client.project = loadCommand('project');
  client.projectId = loadCommand('projectId');
  client.branch = loadCommand('branch');
  client.serve = loadCommand('serve');

  return client;
};
