import { map, get, compact } from 'lodash'
import chalk from 'chalk'
import { error, info, warn } from '../utils/logger'
import { getFile } from '../utils/files'
import { to } from '../utils/async'
import { runCommand } from '../utils/commands'
import { getProjectKey, getFallbackProjectKey } from '../utils/ci'

const skipPrefix = 'Skipping firebase-ci mapEnv'

/**
 * Build a string from mapEnv setting
 * @param {String} functionsVar - Name of variable within functions
 * @param {String} envVar - Variable within environment
 */
function strFromEnvironmentVarSetting(functionsVar, envVar) {
  if (!process.env[envVar]) {
    const msg = `${chalk.cyan(
      envVar
    )} does not exist on within environment variables`
    warn(msg)
    return ''
  }
  return `${functionsVar}="${process.env[envVar]}"`
}

/**
 * Combine all functions config sets from mapEnv settings in
 * .firebaserc to a single functions config set command string.
 * @param {Object} mapEnvSettings - Settings for mapping environment
 */
function buildConfigSetArgs(mapEnvSettings) {
  const settingsStrsArr = compact(
    map(mapEnvSettings, strFromEnvironmentVarSetting)
  )
  if (!settingsStrsArr.length) {
    return null
  }
  // Get project from passed options, falling back to branch name
  const projectKey = getProjectKey(mapEnvSettings)
  return ['functions:config:set', ...settingsStrsArr, '-P', projectKey]
}

/**
 * Map CI environment variables to Firebase functions config variables
 * @param {Object} copySettings - Settings for how environment variables should
 * be copied from CI environment to Firebase Functions Environment
 * @returns {Promise} Resolves with undefined (result of functions config set)
 * @example
 * "ci": {
 *   "mapEnv": {
 *     "SOME_TOKEN": "some.token"
 *   }
 * }
 */
export default async function mapEnv(copySettings) {
  // Load settings from .firebaserc
  const settings = getFile('.firebaserc')

  // Get mapEnv settings from .firebaserc, falling back to settings passed to cli
  const mapEnvSettings = get(settings, 'ci.mapEnv', copySettings)

  if (!mapEnvSettings) {
    const msg = 'mapEnv parameter with settings needed in .firebaserc!'
    warn(msg)
    return null
  }

  // Get project from passed options, falling back to branch name
  const fallbackProjectName = getFallbackProjectKey()
  const projectKey = getProjectKey(copySettings)

  // Get project setting from settings file based on branchName falling back
  // to fallbackProjectName
  const projectName = get(settings, `projects.${projectKey}`)
  const fallbackProjectSetting = get(
    settings,
    `projects.${fallbackProjectName}`
  )

  // Handle project option
  if (!projectName) {
    const nonProjectBranch = `${skipPrefix} - Project ${chalk.cyan(
      projectKey
    )} is not an alias, checking for fallback...`
    warn(nonProjectBranch)
    if (!fallbackProjectSetting) {
      const nonFallbackBranch = `${skipPrefix} - Fallback Project: ${chalk.cyan(
        fallbackProjectName
      )} is a not an alias, exiting...`
      warn(nonFallbackBranch)
      return nonProjectBranch
    }
    return null
  }

  // Create command arguments
  const setConfigArgs = buildConfigSetArgs(mapEnvSettings)
  if (!setConfigArgs) {
    warn(
      `No variables from ${chalk.cyan(
        'mapEnv'
      )} settings found in environment, skipping mapping of environment variables`
    )
    return null
  }

  info('Mapping Environment to Firebase Functions...')

  // Run command to set functions config
  const [configSetErr] = await to(
    runCommand({
      command: 'firebase',
      args: setConfigArgs
    })
  )

  // Handle errors running functions config
  if (configSetErr) {
    const errMsg = `Error setting Firebase functions config variables from variables CI environment (mapEnv):`
    error(errMsg, configSetErr)
    throw new Error(errMsg)
  }

  info('Successfully set functions config from variables in CI environment')
}
