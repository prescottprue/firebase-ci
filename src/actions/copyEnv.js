import { reduce } from 'lodash'
import { error, success, info, warn } from '../utils/logger'
import { getFile } from '../utils/files'
const client = require('firebase-tools')

/**
 * Copy CI environment variables over to Firebase functions
 * @param {Object} copySettings - Settings for how environment variables should
 * be copied from CI environment to Firebase Functions Environment
 * @return {Promise} Resolves with undefined (result of functions config set)
 * @example
 * "ci": {
 *   "copyEnv": {
 *     "SOME_TOKEN": "some.token"
 *   }
 * }
 */
export const copyEnv = (copySettings) => {
  const settings = getFile('.firebaserc')
  if (!settings) {
    error('.firebaserc file is required')
    return
  }
  if (!settings.ci || !settings.ci.copyEnv) {
    warn('copyEnv settings needed in .firebaserc!')
    return
  }
  info('Mapping Environment to Firebase Functions...')
  const mappedSettings = reduce(copySettings, (acc, functionsVar, travisVar) => {
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
