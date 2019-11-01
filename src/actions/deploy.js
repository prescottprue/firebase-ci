import { isUndefined, compact, get } from 'lodash'
import chalk from 'chalk'
import copyVersion from './copyVersion'
import mapEnv from './mapEnv'
import { getFile, functionsExists } from '../utils/files'
import { error, info, warn } from '../utils/logger'
import { runCommand } from '../utils/commands'
import { installDeps, getNpxExists } from '../utils/deps'
import {
  getBranch,
  isPullRequest,
  getDeployMessage,
  getProjectKey,
  getFallbackProjectKey
} from '../utils/ci'
import { to } from '../utils/async'

const skipPrefix = 'Skipping Firebase Deploy'

function getFirebaseTokenStr() {
  const { FIREBASE_TOKEN, FIREBASE_CI_WRAP_TOKEN } = process.env
  if (!FIREBASE_TOKEN) {
    return ''
  }
  if (FIREBASE_CI_WRAP_TOKEN) {
    info('Wrapping token in quotes')
    return `--token "${FIREBASE_TOKEN}"`
  }
  return `--token ${FIREBASE_TOKEN}`
}

/**
 * Run firebase-ci actions
 * @param  {String} project - name of project
 * @return {Promise}
 * @private
 */
export function runActions() {
  copyVersion()
  const settings = getFile('.firebaserc')
  if (functionsExists() && settings.ci && settings.ci.mapEnv) {
    return mapEnv().catch(err => {
      error(
        'Could not map CI environment variables to Functions environment: ',
        err
      )
      return Promise.reject(err)
    })
  }
  info(
    `No ci action settings found in ${chalk.cyan(
      '.firebaserc'
    )}. Skipping action phase.`
  )
  return Promise.resolve({})
}

/**
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 */
export default async function deploy(opts) {
  const settings = getFile('.firebaserc')
  const firebaseJson = getFile('firebase.json')
  const branchName = getBranch()
  if (isUndefined(branchName) || (opts && opts.test)) {
    const nonCiMessage = `${chalk.cyan(
      skipPrefix
    )} - Not a supported CI environment`
    warn(nonCiMessage)
    return nonCiMessage
  }

  if (isPullRequest()) {
    const pullRequestMessage = `${chalk.cyan(
      skipPrefix
    )} - Build is a Pull Request`
    info(pullRequestMessage)
    return pullRequestMessage
  }

  if (!settings) {
    error('.firebaserc file is required')
    throw new Error('.firebaserc file is required')
  }

  if (!firebaseJson) {
    error('firebase.json file is required')
    throw new Error('firebase.json file is required')
  }

  const fallbackProjectName = getFallbackProjectKey()
  // Get project from passed options, falling back to branch name
  const projectKey = getProjectKey(opts)
  // Get project setting from settings file based on branchName falling back
  // to fallbackProjectName
  const projectName = get(settings, `projects.${projectKey}`)
  const fallbackProjectSetting = get(
    settings,
    `projects.${fallbackProjectName}`
  )

  // Handle project alias not existing in .firebaserc
  if (!projectName) {
    const nonProjectBranch = `${skipPrefix} - Project ${chalk.cyan(
      projectKey
    )} is not an alias, checking for fallback...`
    info(nonProjectBranch)
    if (!fallbackProjectSetting) {
      const nonFallbackBranch = `${skipPrefix} - Fallback Project: ${chalk.cyan(
        fallbackProjectName
      )} is a not an alias, exiting...`
      info(nonFallbackBranch)
      return nonProjectBranch
    }
    return nonProjectBranch
  }

  // Warn if FIREBASE_TOKEN does not exist within environment variables
  const { FIREBASE_TOKEN } = process.env
  if (!FIREBASE_TOKEN) {
    warn(
      `${chalk.cyan(
        'FIREBASE_TOKEN'
      )} environment variable not found, falling back to current Firebase auth`
    )
  }

  const onlyString = opts && opts.only ? `--only ${opts.only}` : ''
  const message = getDeployMessage()

  // Install firebase-tools and functions dependencies unless skipped by config
  if (!settings.skipDependencyInstall) {
    await installDeps(opts, settings)
  } else {
    info('firebase-tools and functions dependencies installs skipped')
  }

  // Run CI actions if enabled (i.e. copyVersion, createConfig)
  if (!opts.simple) {
    runActions(opts.actions)
  } else {
    info('Simple mode enabled. Skipping CI actions')
  }

  const firebaseTokenStr = getFirebaseTokenStr()
  const npxExists = getNpxExists()
  let deployArgs = compact([
    'deploy',
    ...onlyString.split(' '),
    ...firebaseTokenStr.split(' '),
    '--non-interactive',
    '--project',
    projectKey,
    '--message',
    message
  ])

  if (process.env.FIREBASE_CI_DEBUG || settings.debug) {
    deployArgs = deployArgs.concat(['--debug'])
    info(`Calling deploy with: ${deployArgs.join(' ')}`)
  }
  info(
    `Deploying to ${branchName} branch to ${projectKey} Firebase project "${projectName}"`
  )
  // Run deploy command
  const [deployErr] = await to(
    runCommand({
      command: npxExists ? 'npx' : 'firebase',
      args: npxExists ? ['firebase'].concat(deployArgs) : deployArgs,
      successMsg: `Successfully Deployed ${branchName} branch to ${projectKey} Firebase project "${projectName}"`
    })
  )

  // Handle errors within the deploy command
  if (deployErr) {
    error('Error in deploying to firebase:\n ', deployErr)
    throw deployErr
  }

  return null
}
