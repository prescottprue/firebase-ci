import { map, get } from 'lodash'
import { error, success, info, warn } from '../utils/logger'
import { getFile } from '../utils/files'
import { to } from '../utils/async'
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
export default async (copySettings) => {
  const settings = getFile('.firebaserc')
  if (!settings) {
    error('.firebaserc file is required')
    return Promise.reject(new Error('.firebaserc file is required'))
  }

  const mapEnvSettings = get(settings, 'ci.mapEnv', copySettings)

  if (!mapEnvSettings) {
    const msg = 'mapEnv parameter with settings needed in .firebaserc!'
    warn(msg)
    throw new Error(msg)
  }

  info('Mapping Environment to Firebase Functions...')

  return Promise.all(
    map(mapEnvSettings, setEnvVarInFunctions)
  )
}

async function setEnvVarInFunctions (functionsVar, travisVar) {
  if (!process.env[travisVar]) {
    const msg = `${travisVar} does not exist on within Travis-CI environment variables`
    success(msg)
    throw new Error(msg)
  }
  info(`Setting ${functionsVar} within Firebase config from ${travisVar} variable on Travis-CI.`)
  // TODO: Check for not allowed characters in functionsVar (camelcase not allowed?)
  const setConfigCommand = `firebase functions:config:set ${functionsVar}="${process.env[travisVar]}"`
  const [configSetErr] = await to(runCommand(setConfigCommand))
  if (configSetErr) {
    const errMsg = `Error setting Firebase functions config variable: ${functionsVar} from ${travisVar} variable on Travis-CI.`
    error(errMsg)
    throw new Error(errMsg)
  }
  info(`Successfully set ${functionsVar} within Firebase config from ${travisVar} variable on Travis-CI.`)
}
