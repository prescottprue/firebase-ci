import { reduce } from 'lodash'
import { error, success, info, warn } from '../utils/logger'
import { getFile } from '../utils/files'
const client = require('firebase-tools')

/**
 * Map CI environment variables to Firebase functions config variables
 * @param {Object} copySettings - Settings for how environment variables should
 * be copied from CI environment to Firebase Functions Environment
 * @return {Promise} Resolves with undefined (result of functions config set)
 * @example
 * "ci": {
 *   "mapEnv": {
 *     "SOME_TOKEN": "some.token"
 *   }
 * }
 */
export default (copySettings) => {
  const settings = getFile('.firebaserc')
  if (!settings) {
    error('.firebaserc file is required')
    throw new Error('.firebaserc file is required')
  }
  if (!settings.ci || !settings.ci.mapEnv) {
    warn('mapEnv parameter with settings needed in .firebaserc!')
    return
  }

  info('Mapping Environment to Firebase Functions...')

  const mappedSettings = reduce(settings.ci.mapEnv, (acc, functionsVar, travisVar) => {
    if (!process.env[travisVar]) {
      warn(`${travisVar} does not exist on within Travis-CI environment variables. ${functionsVar} will not be set!`)
      return acc
    }
    return acc.concat([`${functionsVar}="${process.env[travisVar]}"`])
  }, [])

  return client.functions.config
    .set(mappedSettings, { project: 'top-agent-prue-dev' })
    .then(() => {
      success('Environment correctly mapped from CI to Firebase Functions Config')
      return client
    })
    .catch((err) => {
      error('Error mapping environment to Firebase Functions', err)
      return Promise.reject(err)
    })
}
