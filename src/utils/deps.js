import { functionsExists } from './files'
import { error, info, success } from './logger'
import { runCommand } from './commands'
const npm = require('npm')

const npmInstall = (settings, deps = []) => {
  // Skip installation if functions folder does not exist
  if (settings.prefix === 'functions' && !functionsExists()) {
    info('Functions folder does not exist. Skipping install...')
    return Promise.resolve()
  }
  const depsStr = deps.length ? deps.join(', ') : 'Dependencies'
  info(`Npm Installing ${depsStr}...`)
  return new Promise((resolve, reject) => {
    npm.load(settings, (err, npm) => {
      if (err) {
        error('Error loading functions dependencies', err)
        reject(err)
      } else {
        info(`Calling install for deps: ${deps} with settings: ${settings}`)
        // run npm install
        npm.commands.install(deps, (err) => {
          if (!err) {
            success(`${depsStr} installed successfully`)
            resolve(deps)
          } else {
            error('Error installing functions dependencies', err)
            reject(err)
          }
        })
        // output any log messages
        npm.on('log', message => console.log(message)) // eslint-disable-line no-console
      }
    })
  })
}

/**
 * Install Firebase tools and install
 * @return {[type]} [description]
 */
export const installDeps = (opts = {}) => {
  const { info } = opts
  let promises = [
    // npmInstall({ global: true, loglevel: 'error' }, ['firebase-tools']) // causes can not find module 'boom'
    runCommand({
      command: `npm i -g firebase-tools ${info ? '' : '-q'}`,
      beforeMsg: 'Installing firebase-tools...',
      errorMsg: 'Error installing firebase-tools.',
      successMsg: 'Firebase tools installed successfully!'
    })
  ]
  if (functionsExists()) {
    promises.push(npmInstall({ prefix: 'functions', loglevel: info ? 'info' : 'error' }, []))
  }
  return Promise.all(promises)
}
