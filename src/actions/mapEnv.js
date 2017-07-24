import { map } from 'lodash'
import { error, success, info, warn } from '../utils/logger'
import { getFile } from '../utils/files'
import { runCommand } from '../utils/commands'

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
    return Promise.reject(new Error('.firebaserc file is required'))
  }

  if (!settings.ci || !settings.ci.mapEnv) {
    const msg = 'mapEnv parameter with settings needed in .firebaserc!'
    warn(msg)
    return Promise.reject(new Error(msg))
  }

  info('Mapping Environment to Firebase Functions...')

  return Promise.all(
    map(copySettings, (functionsVar, travisVar) => {
      if (!process.env[travisVar]) {
        const msg = `${travisVar} does not exist on within Travis-CI environment variables`
        success(msg)
        return Promise.reject(msg)
      }
      // TODO: Check for not allowed characters in functionsVar (camelcase not allowed?)
      return runCommand({
        command: `firebase functions:config:set ${functionsVar}="${process.env[travisVar]}"`,
        beforeMsg: `Setting ${functionsVar} within Firebase config from ${travisVar} variable on Travis-CI.`,
        errorMsg: `Error setting Firebase functions config variable: ${functionsVar} from ${travisVar} variable on Travis-CI.`,
        successMsg: `Successfully set ${functionsVar} within Firebase config from ${travisVar} variable on Travis-CI.`
      })
    })
  )
}
