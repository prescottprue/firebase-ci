'use strict'

module.exports = function(client) {
  process.env.FORCE_COLOR = true
  var loadCommand = function(name) {
    return require('./' + name)(client)
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

  return client
}
