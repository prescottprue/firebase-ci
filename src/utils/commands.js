/* eslint-disable no-console */
import stream from 'stream'
import { info } from '../utils/logger'
const { spawn } = require('child_process')

process.env.FORCE_COLOR = true

/**
 * Check to see if the provided value is a promise object
 * @param  {Any}  valToCheck - Value to be checked for Promise qualities
 * @return {Boolean} Whether or not provided value is a promise
 */
export function isPromise(valToCheck) {
  return valToCheck && typeof valToCheck.then === 'function'
}

/**
 * @description Run a bash command using spawn pipeing the results to the main
 * process
 * @param {String} command - Command to be executed
 * @private
 */
export function runCommand({
  beforeMsg,
  successMsg,
  command,
  errorMsg,
  args,
  pipeOutput = true
}) {
  if (beforeMsg) info(beforeMsg)
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: process.env, shell: true })
    let output
    let error
    const customStream = new stream.Writable()
    const customErrorStream = new stream.Writable()
    customStream._write = (data, ...argv) => {
      output += data
      if (pipeOutput) {
        process.stdout._write(data, ...argv)
      }
    }
    customErrorStream._write = (data, ...argv) => {
      error += data
      if (pipeOutput) {
        process.stderr._write(data, ...argv)
      }
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
        reject(error || output)
      } else {
        // resolve(null, stdout)
        if (successMsg) info(successMsg)
        // Remove leading undefined from response
        if (output && output.indexOf('undefined') === 0) {
          resolve(successMsg || output.replace('undefined', ''))
        } else {
          console.log('output: ', output)
          resolve(successMsg || output)
        }
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
