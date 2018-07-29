import commandExists from 'command-exists'
import { functionsExists, functionsNodeModulesExist } from './files'
import { runCommand } from './commands'
import { info as logInfo } from './logger'

const commandExistsSync = commandExists.sync

/**
 * Install Firebase tools and run npm install in functions folder
 * @return {[type]} [description]
 */
export async function installDeps(opts = {}, settings = {}) {
  const { info } = opts
  const { toolsVersion } = settings
  const versionSuffix = toolsVersion ? `@${toolsVersion}` : ''
  const promises = []
  logInfo('Checking to see if firebase-tools already exists...')
  if (!commandExistsSync('firebase')) {
    if (!settings.skipToolsInstall) {
      promises.push(
        runCommand({
          command: `npm i firebase-tools${versionSuffix} ${info ? '' : '-q'}`,
          beforeMsg: 'firebase-tools does not already exist, installing...',
          errorMsg: 'Error installing firebase-tools.',
          successMsg: 'Firebase tools installed successfully!'
        })
      )
    }
  } else {
    logInfo('firebase-tools already exists')
  }
  // Call npm install in functions folder if it exists and does
  // not already contain node_modules
  if (
    functionsExists() &&
    !functionsNodeModulesExist() &&
    !settings.skipFunctionsInstall
  ) {
    promises.push(
      runCommand({
        command: `npm i --prefix functions`,
        beforeMsg: 'Running npm install in functions folder...',
        errorMsg: 'Error installing functions dependencies.',
        successMsg: 'Functions dependencies installed successfully!'
      })
    )
  }
  return Promise.all(promises)
}
