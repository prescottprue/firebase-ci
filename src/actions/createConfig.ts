import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { reduce, template, mapValues, get } from 'lodash'
import { getFile } from '../utils/files'
import { error, info, warn } from '../utils/logger'
import { getProjectKey } from '../utils/ci'

const { CI_ENVIRONMENT_SLUG } = process.env

/**
 * Format message from error object
 * @param {Error} err - Error for which to create formatted message
 * @returns {string} Error message string
 */
function formattedErrorMessage(err) {
  const errMessage = get(err, 'message', 'Issue templating config file')
  if (!errMessage.includes('is not defined')) {
    return errMessage
  }
  const splitMessage = err.message.split(' is not defined')
  return `${chalk.cyan(splitMessage[0])} is not defined in environment`
}

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
    const errMsg = formattedErrorMessage(err)
    warn(`${errMsg}. Setting ${chalk.cyan(name)} to an empty string.`)
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
 *   "createConfig": {
 *     "prod": {
 *        "firebase": {
 *          "apiKey": "${PROD_FIREBASE_API_KEY}"
 *        }
 *     }
 *   }
 * }
 * @private
 */
export default function createConfigFile(config) {
  const settings = getFile('.firebaserc')

  // Check for .firebaserc settings file
  if (!settings) {
    error('.firebaserc file is required')
    throw new Error('.firebaserc file is required')
  }

  // Check for ci section of settings file
  if (!settings.ci || !settings.ci.createConfig) {
    error('no createConfig settings found')
    return
  }

  // Set options object for later use (includes path for config file)
  const opts = {
    path: get(config, 'path', './src/config.js'),
    project: getProjectKey(config)
  }

  // Get environment config from settings file based on settings or branch
  // default is used if TRAVIS_BRANCH env not provided, master used if default not set
  const {
    ci: { createConfig }
  } = settings

  // Fallback to different project name
  const fallBackConfigName =
    CI_ENVIRONMENT_SLUG || (createConfig.master ? 'master' : 'default')

  const envConfig =
    createConfig[opts.project] || createConfig[fallBackConfigName]

  if (!envConfig) {
    const msg = 'Valid create config settings could not be loaded'
    error(msg)
    throw new Error(msg)
  }

  info(
    `Creating config file at ${chalk.cyan(opts.path)} for project: ${chalk.cyan(
      createConfig[opts.project] ? opts.project : fallBackConfigName
    )}`
  )

  // template data based on environment variables
  const templatedData = mapValues(envConfig, (parent, parentName) =>
    typeof parent === 'string'
      ? tryTemplating(parent, parentName)
      : mapValues(parent, (data, childKey) =>
          tryTemplating(data, `${parentName}.${childKey}`)
        )
  )
  // convert object into formatted object string
  const parentAsString = parent =>
    reduce(
      parent,
      (acc, child, childKey) =>
        acc.concat(`  ${childKey}: ${JSON.stringify(child, null, 2)},\n`),
      ''
    )

  // combine all stringified vars and attach default export
  const exportString =
    path.extname(opts.path) === '.json'
      ? JSON.stringify(templatedData, null, 2)
      : reduce(
          templatedData,
          (acc, parent, parentName) =>
            acc
              .concat(`export const ${parentName} = `)
              .concat(
                typeof parent === 'string'
                  ? `"${parent}";\n\n`
                  : `{\n${parentAsString(parent)}};\n\n`
              ),
          ''
        ).concat(
          `export default { ${Object.keys(templatedData).join(', ')} };\n`
        )

  const folderName = path.basename(path.dirname(opts.path))

  // Add folder containing config file if it does not exist
  if (!fs.existsSync(`./${folderName}`)) {
    fs.mkdirSync(folderName)
  }

  // Write config file
  try {
    fs.writeFileSync(opts.path, exportString, 'utf8')
  } catch (err) {
    error('Error creating config file: ', err)
  }
}
