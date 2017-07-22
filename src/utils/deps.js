import { functionsExists } from './files'
import { error, info, success } from './logger'

const npm = require('npm')

const npmInstall = (settings, deps = []) => {
  // Skip installation if functions folder does not exist
  if (settings.prefix === 'functions' && !functionsExists()) {
    info('Functions folder does not exist. Skipping install...')
    return Promise.resolve()
  }
  info('Installing functions dependencies...')
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
            success(`${deps.length ? deps.join(', ') : 'Dependencies'} installed successfully`)
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
export const installDeps = () => {
  let promises = [
    npmInstall({ global: true }, ['firebase-tools'])
    // runCommand({
    //   command: `npm i -g firebase-tools`,
    //   beforeMsg: 'Installing firebase-tools...',
    //   errorMsg: 'Error installing firebase-tools.',
    //   successMsg: 'Firebase tools installed successfully!'
    // })
  ]
  if (functionsExists()) {
    promises.push(npmInstall({ prefix: 'functions', loglevel: 'error' }, []))
  }
  return Promise.all(promises)
}
