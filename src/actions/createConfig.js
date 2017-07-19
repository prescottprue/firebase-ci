import fs from 'fs'
import { reduce, template, mapValues } from 'lodash'
import { getFile } from '../utils/files'
import { error, info, warn } from '../utils/logger'

const { TRAVIS_BRANCH } = process.env

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
export default (config) => {
  const settings = getFile('.firebaserc')

  if (!TRAVIS_BRANCH) {
    warn('Creating config is currently only supported in CI environment')
    return
  }

  if (!settings) {
    error('.firebaserc file is required')
    throw new Error('.firebaserc file is required')
  }

  if (!settings.ci || !settings.ci.createConfig) {
    warn('Create config settings needed in .firebaserc!')
    return
  }

  const opts = {
    path: config.path || './src/config.js',
    branch: config.branch || TRAVIS_BRANCH,
    ...settings.ci.createConfig
  }

  if (!config[opts.branch]) {
    error('Matching branch does not exist in create config settings')
    throw new Error('Matching branch does not exist in create config settings')
  }

  info(`Creating config file at path: ${opts.path}`)

  const envConfig = config[opts.branch]
  // template data based on environment variables
  const templatedData = mapValues(envConfig, parent =>
    mapValues(parent, (data, childKey) => template(data)(process.env) || data)
  )
  // convert object into formatted object string
  const parentAsString = (parent) => reduce(parent, (acc, child, childKey) =>
    acc.concat(`  ${childKey}: ${JSON.stringify(child, null, 2)},\n`)
  , '')
  // combine all stringified vars and attach default export
  const exportString = reduce(templatedData, (acc, parent, parentName) =>
    acc.concat(`export const ${parentName} = {\n${parentAsString(parent)}};\n\n`)
  , '').concat(`export default { ${Object.keys(templatedData).join(', ')} }`)

  try {
    fs.writeFileSync(opts.path, exportString, 'utf8')
  } catch (err) {
    error('Error creating config file: ', err)
  }
}
