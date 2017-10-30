/* eslint-disable no-console */
import { log, info, success, error } from './logger'
const exec = require('child-process-promise').exec

export const isPromise = (obj) => obj && typeof obj.then === 'function'

/**
 * @description Run a bash command using exec.
 * @param {Object} opts - Options object
 * @param {Object} opts.command - Command to be executed
 * @param {Object} opts.beforeMsg - Before callback
 * @param {Object} opts.errorMsg - Error callback
 * @param {Object} opts.successMsg - Success Callback
 * @private
 */
export const runCommand = ({ command, beforeMsg, errorMsg, successMsg }) => {
  if (beforeMsg) {
    info(beforeMsg)
  }
  return exec(command)
    .then(({ stdout, stderr }) => {
      if (stderr) {
        log(stdout) // log output
        if (stderr && stderr.indexOf('npm WARN') !== -1) {
          return stderr
        }
        error(errorMsg, stderr.message || stderr)
        return Promise.reject(stderr)
      }
      if (successMsg) {
        success(successMsg, stdout)
      }
      return stdout
    })
    .catch((err) => {
      if (errorMsg) {
        error(errorMsg, err.message || err)
      }
      return Promise.reject(err)
    })
}

/**
 * @description Create a promise that runs commands in waterfall
 * @param {Array} commands - List of commands to run in order
 * @private
 */
export const createCommandsPromise = (commands) => {
  return runCommand(commands[0])
    .then(() => {
      if (commands[1]) {
        return runCommand(commands[1])
      }
      return commands
    })
  // TODO: Implement this method for running more than two commands
  // return reduce(commands, (l, r) => {
  //   if (!isPromise(l)) {
  //     return runCommand(r)
  //   }
  //   if (isPromise(runCommand(r))) {
  //     return l.then(runCommand(r))
  //   }
  //   return l
  // }, {})
}
