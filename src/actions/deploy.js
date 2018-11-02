import { isUndefined, compact, get } from 'lodash'
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
        'Error mapping CI environment variables to Functions environment: ',
        err
      )
      return Promise.reject(err)
    })
  }
  info('No ci action settings found in .firebaserc. Skipping action phase.')
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
    const nonCiMessage = `${skipPrefix} - Not a supported CI environment`
    warn(nonCiMessage)
    return nonCiMessage
  }

  if (isPullRequest()) {
    const pullRequestMessage = `${skipPrefix} - Build is a Pull Request`
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

  // Handle project option
  if (!projectName) {
    const nonProjectBranch = `${skipPrefix} - Project "${projectKey}" is not an alias, checking for fallback...`
    info(nonProjectBranch)
    if (!fallbackProjectSetting) {
      const nonFallbackBranch = `${skipPrefix} - Fallback Project: "${fallbackProjectName}" is a not an alias, exiting...`
      info(nonFallbackBranch)
      return nonProjectBranch
    }
    return nonProjectBranch
  }

  // Handle FIREBASE_TOKEN not existing within environment variables
  const { FIREBASE_TOKEN } = process.env
  if (!FIREBASE_TOKEN) {
    error('Error: FIREBASE_TOKEN env variable not found.')
    info(
      'Run firebase login:ci (from  firebase-tools) to generate a token' +
        'and place it travis environment variables as FIREBASE_TOKEN'
    )
    throw new Error('Error: FIREBASE_TOKEN env variable not found.')
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
  const npxExists = getNpxExists()
  const deployArgs = compact([
    'deploy',
    onlyString,
    '--token',
    FIREBASE_TOKEN || 'Invalid.Token',
    '--project',
    projectKey,
    '--message',
    message
  ])

  if (process.env.FIREBASE_CI_DEBUG || settings.debug) {
    deployArgs.concat(['--debug'])
  }
  // Run deploy command
  const [deployErr] = await to(
    runCommand({
      command: npxExists ? 'npx' : '$(npm bin)/firebase',
      args: npxExists ? ['firebase'].concat(deployArgs) : deployArgs,
      beforeMsg: `Deploying to ${branchName} branch to ${projectKey} Firebase project "${projectName}"`,
      errorMsg: 'Error deploying to firebase.',
      successMsg: `Successfully Deployed ${branchName} branch to ${projectKey} Firebase project "${projectName}"`
    })
  )

  // Handle errors within the deploy command
  if (deployErr) {
    error('Error in firebase-ci:\n ', deployErr)
    throw deployErr
  }

  return null
}
