/* eslint-disable no-console */
import shell from 'shelljs'

export const isPromise = (obj) => obj && typeof obj.then === 'function'

/**
 * @description Run a bash command using exec.
 * @param {String} command - Command to be executed
 * @private
 */
export const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    shell.exec(command, (code, stdout, stderr) => {
      if (code !== 0) {
        // Resolve for npm warnings
        if (stderr && stderr.indexOf('npm WARN') !== -1) {
          return resolve(stderr)
        }
        reject(stderr.message ? stderr : new Error(stderr), stdout)
      } else {
        resolve(null, stdout)
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
