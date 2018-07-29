import commandExists from 'command-exists'
import { functionsExists, functionsNodeModulesExist } from './files'
import { runCommand } from './commands'
import { info as logInfo } from './logger'
import { to } from './async'

/**
 * Install Firebase tools and install
 * @return {[type]} [description]
 */
export async function installDeps(opts = {}, settings = {}) {
  const { info } = opts
  const { toolsVersion } = settings
  const versionSuffix = toolsVersion ? `@${toolsVersion}` : ''
  const [, firebaseToolsExists] = await to(commandExists('firebase'))
  const promises = []
  if (!firebaseToolsExists) {
    promises.push(
      runCommand({
        command: `npm i firebase-tools${versionSuffix} ${info ? '' : '-q'}`,
        beforeMsg: 'Installing firebase-tools...',
        errorMsg: 'Error installing firebase-tools.',
        successMsg: 'Firebase tools installed successfully!'
      })
    )
  } else {
    logInfo('firebase-tools already exists')
  }
  // Call npm install in functions folder if it exists and does
  // not already contain node_modules
  if (functionsExists() && !functionsNodeModulesExist()) {
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
