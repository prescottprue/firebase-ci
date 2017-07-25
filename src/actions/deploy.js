import { isUndefined } from 'lodash'
import { getFile, functionsExists } from '../utils/files'
import { error, info, warn } from '../utils/logger'
import { runCommand } from '../utils/commands'
import { installDeps } from '../utils/deps'
import copyVersion from './copyVersion'
import createConfig from './createConfig'
import mapEnv from './mapEnv'

const {
  TRAVIS_BRANCH,
  TRAVIS_PULL_REQUEST,
  TRAVIS_COMMIT_MESSAGE,
  FIREBASE_TOKEN
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
  createConfig()
  const settings = getFile('.firebaserc')
  if (functionsExists() && settings.ci && settings.ci.mapEnv) {
    return mapEnv()
      .catch((err) => {
        error('Error mapping CI environment variables to Functions environment: ', err)
        return Promise.reject(err)
      })
  }
  info('No action settings found. Skipping actions.')
  return Promise.resolve({})
}

/**
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 */
export default (opts) => {
  const settings = getFile('.firebaserc')
  const firebaseJson = getFile('firebase.json')
  if (isUndefined(TRAVIS_BRANCH) || (opts && opts.test)) {
    const nonCiMessage = `${skipPrefix} - Not a supported CI environment`
    warn(nonCiMessage)
    return Promise.resolve(nonCiMessage)
  }

  if (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') {
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

  if (settings.projects && !settings.projects[TRAVIS_BRANCH]) {
    const nonBuildBranch = `${skipPrefix} - Branch is not a project alias - Branch: ${TRAVIS_BRANCH}`
    info(nonBuildBranch)
    return Promise.resolve(nonBuildBranch)
  }

  // Handle project option
  if (opts && opts.project && settings.projects && !settings.projects[opts.project]) {
    const nonProjectBranch = `${skipPrefix} - Project is a not an Alias - Project: ${opts.project}`
    info(nonProjectBranch)
    return Promise.resolve(nonProjectBranch)
  }

  if (!FIREBASE_TOKEN) {
    error('Error: FIREBASE_TOKEN env variable not found.')
    info(
      'Run firebase login:ci (from  firebase-tools) to generate a token' +
      'and place it travis environment variables as FIREBASE_TOKEN'
    )
    return Promise.reject(new Error('Error: FIREBASE_TOKEN env variable not found.'))
  }

  const onlyString = opts && opts.only ? `--only ${opts.only}` : ''
  const project = TRAVIS_BRANCH
  const message = TRAVIS_COMMIT_MESSAGE ? TRAVIS_COMMIT_MESSAGE.replace(/"/g, "'") : 'Update'
  return installDeps()
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
        command: `firebase deploy ${onlyString} --token ${FIREBASE_TOKEN} --project ${project} --message "${message}"`,
        beforeMsg: 'Deploying to Firebase...',
        errorMsg: 'Error deploying to firebase:',
        successMsg: `Successfully Deployed to ${project}`
      })
    )
    .catch((err) => {
      error('Error in firebase-ci:\n ', err)
      return Promise.reject(err)
    })
}
