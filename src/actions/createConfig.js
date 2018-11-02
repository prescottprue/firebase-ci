import fs from 'fs'
import path from 'path'
import { reduce, template, mapValues, get, isString } from 'lodash'
import { getFile } from '../utils/files'
import { error, info, warn } from '../utils/logger'

const {
  FIREBASE_CI_PROJECT,
  TRAVIS_BRANCH,
  CIRCLE_BRANCH,
  CI_COMMIT_REF_SLUG,
  CI_ENVIRONMENT_SLUG
} = process.env

function tryTemplating(str, name) {
  try {
    return template(str)(process.env)
  } catch (err) {
    warn(`Warning: ${err.message || 'Issue templating config file'}`)
    warn(`Setting "${name}" to an empty string`)
    return ''
  }
}

/**
 * Create config file based on CI environment variables
 * @param {Object} settings - Settings for how environment variables should
 * be copied from Travis-CI to Firebase Functions Config
 * @param {String} settings.path - Path where config file should be written
 * @return {Promise} Resolves with undefined (result of functions config set)
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
    return
  }

  // Set options object for later use (includes path for config file)
  const opts = {
    path: get(config, 'path', './src/config.js'),
    project: get(
      config,
      'project',
      FIREBASE_CI_PROJECT ||
        TRAVIS_BRANCH ||
        CIRCLE_BRANCH ||
        CI_COMMIT_REF_SLUG
    )
  }

  // Get environment config from settings file based on settings or branch
  // default is used if TRAVIS_BRANCH env not provided, master used if default not set
  const {
    ci: { createConfig }
  } = settings

  // Fallback to different project name
  const fallBackConfigName =
    CI_ENVIRONMENT_SLUG || (createConfig.master ? 'master' : 'default')

  info(`Attempting to load config for project: "${opts.project}"`)

  if (!createConfig[opts.project]) {
    info(
      `Project named "${
        opts.project
      }" does not exist in create config settings, falling back to ${fallBackConfigName}`
    )
  }

  const envConfig = createConfig[opts.project]
    ? createConfig[opts.project]
    : createConfig[fallBackConfigName]

  if (!envConfig) {
    const msg = 'Valid create config settings could not be loaded'
    error(msg)
    throw new Error(msg)
  }

  info(`Creating config file at path: ${opts.path}`)

  // template data based on environment variables
  const templatedData = mapValues(
    envConfig,
    (parent, parentName) =>
      isString(parent)
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
  const exportString = reduce(
    templatedData,
    (acc, parent, parentName) =>
      acc
        .concat(`export const ${parentName} = `)
        .concat(
          isString(parent)
            ? `"${parent}";\n\n`
            : `{\n${parentAsString(parent)}};\n\n`
        ),
    ''
  ).concat(`export default { ${Object.keys(templatedData).join(', ')} }`)

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
