import { getFile, functionsExists } from '../utils/files'
import { error, info } from '../utils/logger'
import { to } from '../utils/async'
import { shellescape, runCommand } from '../utils/commands'
import copyVersion from './copyVersion'
import mapEnv from './mapEnv'
// force colors to come through shelljs
process.env.FORCE_COLOR = 1

const {
  TRAVIS_BRANCH,
  TRAVIS_PULL_REQUEST,
  TRAVIS_COMMIT_MESSAGE,
  FIREBASE_TOKEN
} = process.env

const skipPrefix = 'Skipping Firebase Deploy'

function cleanDeployMessage (messageStr) {
  // TODO: Confirm actual max message length
  const shortenedString = messageStr.substring(0, 250)
  return shellescape(shortenedString)
}

/**
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 */
export default async (opts) => {
  const settings = getFile('.firebaserc')
  const firebaseJson = getFile('firebase.json')

  if (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') {
    const pullRequestMessage = `${skipPrefix} - Build is a Pull Request`
    info(pullRequestMessage)
    return pullRequestMessage
  }

  if (!settings) {
    error('.firebaserc file is required')
    throw new Error('.firebaserc file is required')
  }

  if (!firebaseJson) {
    error('firebase.json file is required to deploy')
    throw new Error('firebase.json file is required to deploy')
  }

  if (settings.projects && !settings.projects[TRAVIS_BRANCH]) {
    const nonBuildBranch = `${skipPrefix} - Branch is not a project alias - Branch: ${TRAVIS_BRANCH}`
    info(nonBuildBranch)
    return nonBuildBranch
  }

  // Handle project option
  if (opts && opts.project && settings.projects && !settings.projects[opts.project]) {
    const nonProjectBranch = `${skipPrefix} - Project is a not an Alias - Project: ${opts.project}`
    info(nonProjectBranch)
    return nonProjectBranch
  }

  if (!FIREBASE_TOKEN) {
    error('Error: FIREBASE_TOKEN env variable not found.')
    info(
      'Run firebase login:ci (from  firebase-tools) to generate a token' +
      'and place it travis environment variables as FIREBASE_TOKEN'
    )
    throw new Error('Error: FIREBASE_TOKEN env variable not found.')
  }

  const onlyString = opts && opts.only ? `--only ${opts.only}` : ''
  const project = TRAVIS_BRANCH || 'default'
  const message = TRAVIS_COMMIT_MESSAGE
    ? cleanDeployMessage(TRAVIS_COMMIT_MESSAGE)
    : 'Update'

  // Install firebase-tools through npm for deploy capability
  info('Installing firebase-tools for deploy command...')
  const [toolsInstallErr] = await to(runCommand('npm i firebase-tools'))
  if (toolsInstallErr) {
    error('Error installing firebase-tools: ', toolsInstallErr)
    throw toolsInstallErr
  }

  info('Firebase tools installed successfully!')

  // Install dependencies within functions folder if the folder exists
  if (functionsExists()) {
    info('Installing functions dependencies')
    const [installErr] = await to(runCommand('npm i --prefix functions'))
    if (installErr) {
      error('Error installing Functions dependencies', installErr.message || installErr)
      throw installErr
    }
    info('Functions dependencies installed successfully!')
  }

  if (!opts.simple) {
    info('Simple mode enabled. Skipping CI actions')
  } else {
    copyVersion()
    const settings = getFile('.firebaserc')
    if (functionsExists() && settings.ci && settings.ci.mapEnv) {
      const [mapEnvErr] = await to(mapEnv())
      if (mapEnvErr) {
        error('Error mapping CI environment variables to Functions environment: ')
        throw mapEnvErr
      }
      info('No firebase-ci action settings found in .firebaserc, skipping actions...')
    } else {
      info('No firebase-ci ci action settings found in .firebaserc, skipping actions...')
    }
  }

  info('Deploying to Firebase...')

  const deployCommand = [
    'firebase',
    'deploy',
    onlyString,
    '--token',
    FIREBASE_TOKEN,
    '--project',
    project,
    '--message',
    `"${message}"`
  ].join(' ')
  const [deployErr, deployCommandResult] = await to(runCommand(deployCommand))
  if (deployErr) {
    throw deployErr
  }
  return deployCommandResult
}
