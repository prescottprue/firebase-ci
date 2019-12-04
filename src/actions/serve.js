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
 * @param {string} functionsVar - Name of variable within functions
 * @param {string} envVar - Variable within environment
 * @returns {string} Environment variable set string
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
 * @param {object} mapEnvSettings - Settings for mapping environment
 * @returns {Array} List of arguments for setting functions config
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
 * Serve specific project
 * @param {object} opts - Settings for serving
 * @returns {Promise} Resolves after serve is called
 */
export default async function serve(opts) {
  // Load settings from .firebaserc
  const settings = getFile('.firebaserc')

  // Get mapEnv settings from .firebaserc, falling back to settings passed to cli
  const serveSettings = get(settings, 'ci.mapEnv', opts)

  // Get project from passed options, falling back to branch name
  const fallbackProjectName = getFallbackProjectKey()
  const projectKey = getProjectKey(serveSettings)

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

  info(
    `Calling serve for project ${chalk.cyan(projectName)} (alias ${chalk.cyan(
      projectKey
    )})`
  )

  const serveArgs = ['serve', '-P', projectKey]
  const onlyString = opts && opts.only ? `--only ${opts.only}` : ''
  if (onlyString) {
    serveArgs.push(onlyString)
  }

  // Run command to set functions config
  const [serveErr] = await to(
    runCommand({
      command: 'firebase',
      args: serveArgs
    })
  )

  // Handle errors running functions config
  if (serveErr) {
    const errMsg = `Error calling serve for ${chalk.cyan(
      projectName
    )} (alias ${chalk.cyan(projectKey)}) :`
    error(errMsg, serveErr)
    throw new Error(errMsg)
  }

  info(
    `Successfully called serve for project ${chalk.cyan(
      projectName
    )} (alias ${chalk.cyan(projectKey)})`
  )
}
