/* eslint-disable no-param-reassign */
module.exports = function setupCommands(client) {
  process.env.FORCE_COLOR = true;

  /**
   * Load command from file by name
   * @param name - Name of command
   * @returns {object} Command object
   */
  function loadCommand(name) {
    return require('../lib/commands/' + name).default(client) // eslint-disable-line
  }

  client.deploy = loadCommand('deploy')
  client.createConfig = loadCommand('createConfig')
  client.copyVersion = loadCommand('copyVersion')
  client.mapEnv = loadCommand('mapEnv')
  client.run = loadCommand('run')
  client.project = loadCommand('project')
  client.projectId = loadCommand('projectId')
  client.branch = loadCommand('branch')
  client.serve = loadCommand('serve')

  return client;
};
