import { functionsExists, functionsNodeModulesExist } from './files'
import { runCommand } from './commands'
import { info as logInfo, error } from './logger'

/**
 * Install Firebase tools and run npm install in functions folder
 * @return {Promise} Resolves when dependencies have been installed
 */
export async function installDeps(opts = {}, settings = {}) {
  const { info } = opts
  const { toolsVersion } = settings
  const versionSuffix = toolsVersion ? `@${toolsVersion}` : ''
  // Check version of firebase tools using npx (to allow for locally and
  // globally installed versions of firebase-tools)
  const fbVersion = await runCommand({
    command: 'npx',
    args: ['firebase', '--version'],
    pipeOutput: false,
    beforeMsg: 'Checking to see if firebase-tools is installed...',
    errorMsg: 'Error checking for firebase-tools.'
  })
  // Skip installing firebase-tools if specified by config
  if (settings.skipToolsInstall) {
    // Throw for missing version when skipping install
    if (!fbVersion) {
      const missingFbTools =
        'firebase-tools install skipped, and no existing version found!'
      error(missingFbTools)
      throw new Error(missingFbTools)
    }
    logInfo(`Installing of firebase-tools skipped based on config settings.`)
  } else {
    // Log version of firebase-tools if it exists, otherwise install
    if (fbVersion) {
      logInfo(`firebase-tools already exists, version: ${fbVersion}`)
    } else {
      // Install firebase-tools using npm
      await runCommand({
        command: 'npm',
        args: ['i', `firebase-tools${versionSuffix}`, `${info ? '' : '-q'}`],
        beforeMsg: 'firebase-tools does not already exist, installing...',
        errorMsg: 'Error installing firebase-tools.',
        successMsg: 'Firebase tools installed successfully!'
      })
    }
  }
  // Call npm install in functions folder if it exists and does
  // not already contain node_modules
  if (
    functionsExists() &&
    !functionsNodeModulesExist() &&
    !settings.skipFunctionsInstall
  ) {
    await runCommand({
      command: `npm i --prefix functions`,
      beforeMsg: 'Running npm install in functions folder...',
      errorMsg: 'Error installing functions dependencies.',
      successMsg: 'Functions dependencies installed successfully!'
    })
  }
}
