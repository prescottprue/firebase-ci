/* eslint-disable no-console */
import { drop, compact } from 'lodash'
import stream from 'stream'
import { info } from '../utils/logger'
const { spawn } = require('child_process')

process.env.FORCE_COLOR = true

export const isPromise = (obj) => obj && typeof obj.then === 'function'

/**
 * @description Run a bash command using exec.
 * @param {String} command - Command to be executed
 * @private
 */
export const runCommand = (command) => {
  if (command.beforeMsg) info(command.beforeMsg)
  return new Promise((resolve, reject) => {
    const child = spawn(
      command.command.split(' ')[0],
      command.args || compact(drop(command.command.split(' ')))
    )
    var customStream = new stream.Writable()
    var customErrorStream = new stream.Writable()
    let output
    let error
    customStream._write = (data, ...argv) => {
      output += data
      process.stdout._write(data, ...argv)
    }
    customErrorStream._write = (data, ...argv) => {
      error += data
      process.stderr._write(data, ...argv)
    }
    // Pipe errors and console output to main process
    child.stdout.pipe(customStream)
    child.stderr.pipe(customErrorStream)
    // When child exits resolve or reject based on code
    child.on('exit', (code, signal) => {
      if (code !== 0) {
        // Resolve for npm warnings
        if (output && output.indexOf('npm WARN') !== -1) {
          return resolve(command.successMsg || output)
        }
        reject(command.errorMsg || error)
      } else {
        // resolve(null, stdout)
        if (command.successMsg) info(command.successMsg)
        resolve(command.successMsg || output)
      }
    })
  })
}

/**
 * Escape shell command arguments and join them to a single string
 * @param  {Array} a - List of arguments to escape
 * @return {String} Command string with arguments escaped
 */
export function shellescape (a) {
  let ret = []

  a.forEach((s) => {
    if (/[^A-Za-z0-9_\/:=-]/.test(s)) { // eslint-disable-line no-useless-escape
      s = "'" + s.replace(/'/g, "'\\''") + "'"
      s = s.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'") // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    ret.push(s)
  })

  return ret.join(' ')
}
