import chalk from 'chalk'
import { template, mapValues } from 'lodash'
import { appendFileSync } from 'fs'
import { getFile } from '../utils/files'
import { error, info, warn } from '../utils/logger'
import { getProjectKey } from '../utils/ci'

const { CI_ENVIRONMENT_SLUG } = process.env

/**
 * Try templating a string with the current node environment.
 * Used to convert environment variables within createConfig settings.
 * @param {string} str - String to try templating
 * @param {string} name - Name of variable (used for warning log)
 * @returns {string} Templated string
 */
function tryTemplating(str, name) {
  const { version } = getFile('package.json')
  try {
    return template(str)({
      ...process.env,
      version,
      npm_package_version: version
    })
  } catch (err) {
    warn(`${err.message}. Setting ${chalk.cyan(name)} to an empty string.`)
    return ''
  }
}

/**
 * Create config file based on CI environment variables
 * @param {object} config - Settings for how environment variables should
 * be copied from Travis-CI to Firebase Functions Config
 * @param {string} config.path - Path where config file should be written
 * @example
 * "ci": {
 *   "setEnv": {
 *     "master": {
 *       "REACT_APP_FIREBASE_apiKey": "${MASTER_FIREBASE_API_KEY}",
 *       "REACT_APP_FIREBASE_projectID": "some-project"
 *     },
 *     "prod": {
 *       "REACT_APP_FIREBASE_apiKey": "${PROD_FIREBASE_API_KEY}",
 *       "REACT_APP_FIREBASE_projectID": "some-project"
 *     }
 *   }
 * }
 * @private
 */
export default async function setEnvConfig(config) {
  const settings = getFile('.firebaserc')

  // Check for .firebaserc settings file
  if (!settings) {
    error('.firebaserc file is required')
    throw new Error('.firebaserc file is required')
  }

  // Check for ci section of settings file
  if (!settings.ci?.setEnv) {
    error('no setEnv settings found')
    return
  }

  // Set options object for later use (includes path for config file)
  const selectedProject = getProjectKey(config)

  // Get environment config from settings file based on settings or branch
  // default is used if TRAVIS_BRANCH env not provided, master used if default not set
  const {
    ci: { setEnv }
  } = settings

  // Fallback to different project name
  const fallBackConfigName =
    CI_ENVIRONMENT_SLUG || (setEnv.master ? 'master' : 'default')

  const envConfig = setEnv[selectedProject] || setEnv[fallBackConfigName]

  if (!envConfig) {
    const msg = 'Valid create config settings could not be loaded'
    error(msg)
    throw new Error(msg)
  }

  info(`Setting environment from config for project ${selectedProject}`)

  // template data based on environment variables
  const templatedData = mapValues(envConfig, (parent, parentName) =>
    typeof parent === 'string'
      ? tryTemplating(parent, parentName)
      : mapValues(parent, (data, childKey) =>
          tryTemplating(data, `${parentName}.${childKey}`)
        )
  )
  if (process.env.GITHUB_ACTIONS) {
    info(`Github actions environment detected setting-env will also be called`)
  }

  // Set templated data info to environment
  Object.keys(templatedData).forEach((currentKey) => {
    process.env[currentKey] = templatedData[currentKey]
    if (process.env.GITHUB_ACTIONS) {
      appendFileSync(
        process.env.GITHUB_ENV,
        `${currentKey}=${templatedData[currentKey]}`
      )
    }
  })
}
