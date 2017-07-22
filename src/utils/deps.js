import { functionsExists } from './files'
import { error, info, success } from './logger'

const npm = require('npm')

const npmInstall = (settings, deps = []) => {
  // Skip installation if functions folder does not exist
  if (!functionsExists()) {
    info('Functions folder does not exist. Skipping install...')
    return Promise.resolve()
  }
  info('Installing functions dependencies...')
  return new Promise((resolve, reject) => {
    npm.load({ prefix: './functions', loglevel: 'error' }, (err, npm) => {
      if (err) {
        error('Error loading functions dependencies', err)
        reject(err)
      } else {
        info('Npm load completed. Calling install...')
        // run npm install
        npm.commands.install([], (err) => {
          if (!err) {
            success('Functions dependencies installed successfully')
            resolve()
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

const installFunctionsDeps = npmInstall({ prefix: './functions', loglevel: 'error' }, [])
const installFirebaseTools = npmInstall({ global: true }, ['firebase-tools'])
/**
 * Install Firebase tools and install
 * @return {[type]} [description]
 */
export const installDeps = () => {
  let promises = [
    installFirebaseTools
    // runCommand({
    //   command: `npm i -g firebase-tools`,
    //   beforeMsg: 'Installing firebase-tools...',
    //   errorMsg: 'Error installing firebase-tools.',
    //   successMsg: 'Firebase tools installed successfully!'
    // })
  ]
  if (functionsExists()) {
    promises.push(installFunctionsDeps)
  }
  return Promise.all(promises)
}
