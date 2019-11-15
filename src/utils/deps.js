import commandExists from 'command-exists'
import { functionsExists, functionsNodeModulesExist } from './files'
import { runCommand } from './commands'
import { to } from './async'
import { info as logInfo, error } from './logger'

/**
 * Install Firebase tools and run npm install in functions folder
 * @param {object} opts - Options
 * @param {object} settings - Extra settings
 * @param {object} settings.toolsVersion - Version of firebase-tools to install
 * @returns {Promise} Resolves when dependencies have been installed
 */
export async function installDeps(opts = {}, settings = {}) {
  const { info } = opts
  const { toolsVersion } = settings
  const versionSuffix = toolsVersion ? `@${toolsVersion}` : ''
  const npxExists = commandExists.sync('npx')
  // Check version of firebase tools using npx (to allow for locally and
  // globally installed versions of firebase-tools) falling back to npm bin
  logInfo('Checking to see if firebase-tools is installed...')
  const [versionErr, fbVersion] = await to(
    runCommand({
      command: npxExists ? 'npx' : 'firebase',
      args: npxExists ? ['firebase', '--version'] : ['--version'],
      pipeOutput: false
    })
  )

  // Handle errors getting firebase-tools version
  if (versionErr) {
    const getVersionErrMsg =
      'Error attempting to check for firebase-tools version.'
    error(getVersionErrMsg, versionErr)
    throw new Error(getVersionErrMsg)
  }

  const promises = []
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
      promises.push(
        runCommand({
          command: 'npm',
          args: ['i', `firebase-tools${versionSuffix}`, `${info ? '' : '-q'}`],
          beforeMsg: 'firebase-tools does not already exist, installing...',
          errorMsg: 'Error installing firebase-tools.',
          successMsg: 'Firebase tools installed successfully!'
        })
      )
    }
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
        command: 'npm',
        args: ['i', '--prefix', 'functions'],
        beforeMsg: 'Running npm install in functions folder...',
        errorMsg: 'Error installing functions dependencies.',
        successMsg: 'Functions dependencies installed successfully!'
      })
    )
  }

  // Run installs in parallel for quickest completion
  return Promise.all(promises)
}
