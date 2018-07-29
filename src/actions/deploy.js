import { isUndefined, compact, get } from 'lodash'
import { getFile, functionsExists } from '../utils/files'
import { error, info, warn } from '../utils/logger'
import { runCommand, shellescape } from '../utils/commands'
import { installDeps } from '../utils/deps'
import copyVersion from './copyVersion'
import mapEnv from './mapEnv'

const {
  TRAVIS_BRANCH,
  TRAVIS_PULL_REQUEST,
  TRAVIS_COMMIT_MESSAGE,
  CIRCLE_BRANCH,
  CIRCLE_PR_NUMBER,
  FIREBASE_TOKEN,
  CI,
  CI_COMMIT_MESSAGE,
  CI_COMMIT_REF_SLUG,
  CI_ENVIRONMENT_SLUG,
  CIRCLE_SHA1
} = process.env

const skipPrefix = 'Skipping Firebase Deploy'

/**
 * Run firebase-ci actions
 * @param  {String} project - name of project
 * @return {Promise}
 * @private
 */
export const runActions = () => {
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
  info('No ci action settings found in .firebaserc. Skipping actions.')
  return Promise.resolve({})
}

/**
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 */
export default opts => {
  const settings = getFile('.firebaserc')
  const firebaseJson = getFile('firebase.json')
  if (
    (isUndefined(TRAVIS_BRANCH) &&
      isUndefined(CIRCLE_BRANCH) &&
      isUndefined(CI)) ||
    (opts && opts.test)
  ) {
    const nonCiMessage = `${skipPrefix} - Not a supported CI environment`
    warn(nonCiMessage)
    return Promise.resolve(nonCiMessage)
  }

  if (
    (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') ||
    (!!CIRCLE_PR_NUMBER && CIRCLE_PR_NUMBER !== 'false')
  ) {
    const pullRequestMessage = `${skipPrefix} - Build is a Pull Request`
    info(pullRequestMessage)
    return Promise.resolve(pullRequestMessage)
  }

  if (!settings) {
    error('.firebaserc file is required')
    return Promise.reject(new Error('.firebaserc file is required'))
  }

  if (!firebaseJson) {
    error('firebase.json file is required')
    return Promise.reject(new Error('firebase.json file is required'))
  }

  const branchName = TRAVIS_BRANCH || CIRCLE_BRANCH || CI_COMMIT_REF_SLUG
  const fallbackProjectName = CI_ENVIRONMENT_SLUG
  // Get project from passed options, falling back to branch name
  const projectName = get(opts, 'project', branchName)
  // Get project setting from settings file based on branchName falling back
  // to fallbackProjectName
  const projectSetting = get(settings, `projects.${projectName}`)
  const fallbackProjectSetting = get(
    settings,
    `projects.${fallbackProjectName}`
  )
  // Handle project option
  if (!projectSetting) {
    const nonProjectBranch = `${skipPrefix} - Project is a not an Alias - ${
      opts.project ? 'Project' : 'Branch'
    }: ${projectName}, checking for fallback...`
    info(nonProjectBranch)
    if (!fallbackProjectSetting) {
      const nonFallbackBranch = `${skipPrefix} - Fallback Project is a not an Alias - ${
        opts.project ? 'Project' : 'Branch'
      }: ${fallbackProjectName} exiting...`
      info(nonFallbackBranch)
      return Promise.resolve(nonProjectBranch)
    }
    return Promise.resolve(nonProjectBranch)
  }

  if (!FIREBASE_TOKEN) {
    error('Error: FIREBASE_TOKEN env variable not found.')
    info(
      'Run firebase login:ci (from  firebase-tools) to generate a token' +
        'and place it travis environment variables as FIREBASE_TOKEN'
    )
    return Promise.reject(
      new Error('Error: FIREBASE_TOKEN env variable not found.')
    )
  }

  const originalMessage =
    TRAVIS_COMMIT_MESSAGE || CIRCLE_SHA1 || CI_COMMIT_MESSAGE

  const onlyString = opts && opts.only ? `--only ${opts.only}` : ''
  const project = branchName || settings.projects.default
  // // First 300 characters of travis commit message or "Update"
  const message = originalMessage
    ? originalMessage.replace(/"/g, "'").substring(0, 300)
    : 'Update'
  info('Installing dependencies...')
  return installDeps(opts, settings)
    .then(() => {
      if (opts.simple) {
        info('Simple mode enabled. Skipping CI actions')
        return {}
      }
      return runActions(opts.actions)
    })
    .then(() =>
      // Wait until all other commands are complete before calling deploy
      runCommand({
        command: '$(npm bin)/firebase',
        args: compact([
          'deploy',
          onlyString,
          '--token',
          FIREBASE_TOKEN || 'Invalid.Token',
          '--project',
          project,
          '--message',
          shellescape([message])
        ]),
        beforeMsg: 'Deploying to Firebase...',
        errorMsg: 'Error deploying to firebase.',
        successMsg: `Successfully Deployed to ${project}`
      })
    )
    .catch(err => {
      error('Error in firebase-ci:\n ', err)
      return Promise.reject(err)
    })
}
