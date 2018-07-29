/* eslint-disable no-console */
import { drop, compact, isArray } from 'lodash'
import stream from 'stream'
import { info } from '../utils/logger'
const { spawn } = require('child_process')

process.env.FORCE_COLOR = true

export function isPromise(obj) {
  return obj && typeof obj.then === 'function'
}

/**
 * @description Run a bash command using spawn pipeing the results to the main
 * process
 * @param {String} command - Command to be executed
 * @private
 */
export function runCommand({ beforeMsg, successMsg, command, errorMsg, args }) {
  if (beforeMsg) info(beforeMsg)
  return new Promise((resolve, reject) => {
    const child = spawn(
      isArray(command) ? command[0] : command.split(' ')[0],
      args || compact(drop(command.split(' ')))
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
          return resolve(successMsg || output)
        }
        reject(errorMsg || error)
      } else {
        // resolve(null, stdout)
        if (successMsg) info(successMsg)
        resolve(successMsg || output)
      }
    })
  })
}

/**
 * Escape shell command arguments and join them to a single string
 * @param  {Array} a - List of arguments to escape
 * @return {String} Command string with arguments escaped
 */
export function shellescape(a) {
  let ret = []

  a.forEach(s => {
    if (/[^A-Za-z0-9_/:=-]/.test(s)) {
      // eslint-disable-line no-useless-escape
      s = "'" + s.replace(/'/g, "'\\''") + "'"
      s = s
        .replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'") // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    ret.push(s)
  })

  return ret.join(' ')
}
