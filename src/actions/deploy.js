import chalk from 'chalk'
import { isUndefined } from 'lodash'
import { getFile, functionsExists } from '../utils/files'
import { error, success, info, warn } from '../utils/logger'
import copyVersion from './copyVersion'
import createConfig from './createConfig'
import mapEnv from './mapEnv'
import npm from 'npm'
const client = require('firebase-tools')

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
export const runActions = (project) => {
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
 * Run npm install within functions directory if it exists
 * @return {Promise} Resolves when installing is complete
 */
const installFunctionsDeps = () => {
  // Skip installation if functions folder does not exist
  if (!functionsExists()) {
    return Promise.resolve()
  }
  info('Installing functions dependencies...')
  return new Promise((resolve, reject) => {
    npm.load({ prefix: './functions', loglevel: 'error' }, (err, loadedNpm) => {
      if (err) {
        error('Error loading functions dependencies', err)
        reject(err)
      } else {
        info('Npm load completed. Calling install...')
        // output any log messages
        loadedNpm.on('log', (message) => console.log(message))
        // run npm install
        loadedNpm.commands.install([], (err) => {
          if (!err) {
            success('Functions dependencies installed successfully')
            resolve()
          } else {
            error('Error installing functions dependencies', err)
            reject(err)
          }
        })
      }
    })
  })
}

/**
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 */
export default (opts, directory) => {
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
    return Promise.reject('.firebaserc file is required')
  }

  if (!firebaseJson) {
    error('firebase.json file is required')
    return Promise.reject('firebase.json file is required')
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
    const noToken = 'Error: FIREBASE_TOKEN env variable not found'
    error(noToken)
    console.log(
      chalk.blue(
        'Run firebase login:ci (from  firebase-tools) to generate a token' +
        'and place it travis environment variables as FIREBASE_TOKEN'
      )
    )
    return Promise.reject(noToken)
  }

  const onlyString = opts && opts.only ? opts.only : 'hosting'
  const project = TRAVIS_BRANCH || opts.project

  return installFunctionsDeps()
    .then(() => {
      info(`Setting Firebase project to alias ${project}`)
      return client.use(project, {}) // object needed as second arg
    })
    .then(() => {
      success(`Successfully set Firebase project to alias ${project}`)
      info('Deploying to Firebase...')
      return client.deploy({
        token: FIREBASE_TOKEN,
        message: TRAVIS_COMMIT_MESSAGE || 'Recent Updates',
        project,
        cwd: process.cwd(),
        nonInteractive: true,
        only: onlyString
      })
      .catch((err) => {
        error('Error in firebase-ci:\n ', err)
        return Promise.reject(err)
      })
    })
    .then(() => success(`Successfully Deployed to ${project}`))
    .catch((err) => {
      error('Error in firebase-ci:\n ', err)
      return Promise.reject(err)
    })
}
