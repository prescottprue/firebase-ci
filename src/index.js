/* eslint-disable no-console */
import chalk from 'chalk'
import fs from 'fs'
import { isUndefined, reduce, template, mapValues } from 'lodash'
import { runCommand } from './utils/commands'
import path from 'path'
const client = require('firebase-tools')

const {
  TRAVIS_BRANCH,
  TRAVIS_PULL_REQUEST,
  TRAVIS_COMMIT_MESSAGE,
  FIREBASE_TOKEN
} = process.env

const skipPrefix = 'Skipping Firebase Deploy'

/**
 * Get settings from firebaserc file
 * @return {Object} Firebase settings object
 */
const getFile = (filePath) => {
  const localPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(localPath)) {
    console.log(chalk.red(`${filePath} file does not exist!`), ' Run firebase init to create.')
    // throw new Error(`${filePath} file does not exist! Run firebase init to create.`)
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'))
  } catch (err) {
    console.log(chalk.red(`Error parsing ${filePath}.`), 'JSON is most likley not valid')
    return {}
  }
}

const settings = getFile('.firebaserc')
const firebaseJson = getFile('firebase.json')

/**
 * Copy version from main package file into functions package file
 */
const copyVersion = () => {
  console.log(chalk.blue('Copying version into functions package.json...'))
  const pkg = JSON.parse(fs.readFileSync(`./package.json`))
  const functionsPkg = JSON.parse(fs.readFileSync(`./functions/package.json`))
  functionsPkg.version = pkg.version
  fs.writeFileSync(`./functions/package.json`, JSON.stringify(functionsPkg, null, 2), 'utf8')
}

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
 * @private
 */
const copyEnv = (copySettings) => {
  console.log(chalk.blue('Mapping Environment to Firebase Functions...'))
  const mappedSettings = reduce(copySettings, (acc, functionsVar, travisVar) => {
    if (!process.env[travisVar]) {
      const msg = `${travisVar} does not exist on within Travis-CI environment variables. ${functionsVar} will not be set!`
      console.log(chalk.blue(msg))
      return acc
    }
    return acc.concat([`${functionsVar}="${process.env[travisVar]}"`])
  }, [])
  return client.functions.config
    .set(mappedSettings, { project: 'top-agent-prue-dev' })
    .catch((err) => {
      console.log('Error mapping environment to Firebase Functions', err)
    })
}

/**
 * Create config file based on CI environment variables
 * @param {Object} settings - Settings for how environment variables should
 * be copied from Travis-CI to Firebase Functions Config
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
const createConfig = (config) => {
  console.log(chalk.blue('Creating config file...'))
  if (!config[TRAVIS_BRANCH]) {
    console.log(chalk.red('Matching branch does not exist to create config'))
  }
  const envConfig = config.prod
  const templatedData = mapValues(envConfig, (parent) =>
    mapValues(parent, (data, childKey) => {
      try {
        return template(data)(process.env) || data
      } catch (err) {
        console.log('------- Error in creating config\n', err)
        return data
      }
    })
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
    fs.writeFileSync(config.path, exportString, 'utf8')
  } catch (err) {
    console.log(chalk.red('Error creating config file: '), err)
  }
}

/**
 * Run firebase-ci actions
 * @param  {String} project - name of project
 * @return {Promise}
 * @private
 */
const runActions = (project) => {
  if (fs.existsSync('functions') && settings.ci) {
    if (settings.ci.copyVersion) {
      copyVersion()
    }
    if (settings.ci.mapEnv) {
      return copyEnv(settings.ci.mapEnv)
        .catch((err) => {
          console.log(chalk.red('Error mapping CI environment variables to Functions environment: '), err)
          return Promise.reject(err)
        })
    }
    if (settings.ci.createConfig) {
      createConfig({
        path: './src/config.js',
        ...settings.ci.createConfig
      })
    }
  }
  console.log(chalk.blue('No action settings found. Skipping actions.'))
  return Promise.resolve({})
}

/**
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 */
const deployToFirebase = (opts, directory) => {
  if (isUndefined(TRAVIS_BRANCH) || (opts && opts.test)) {
    const nonCiMessage = `${skipPrefix} - Not a supported CI environment`
    console.log(chalk.yellow(nonCiMessage))
    return Promise.resolve(nonCiMessage)
  }

  if (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') {
    const pullRequestMessage = `${skipPrefix} - Build is a Pull Request`
    console.log(chalk.blue(pullRequestMessage))
    return Promise.resolve(pullRequestMessage)
  }

  if (!settings) {
    console.log(chalk.red('.firebaserc file is required'))
    return Promise.reject('.firebaserc file is required')
  }

  if (!firebaseJson) {
    console.log(chalk.red('firebase.json file is required'))
    return Promise.reject('firebase.json file is required')
  }

  if (settings.projects && !settings.projects[TRAVIS_BRANCH]) {
    const nonBuildBranch = `${skipPrefix} - Branch is not a project alias - Branch: ${TRAVIS_BRANCH}`
    console.log(chalk.blue(nonBuildBranch))
    return Promise.resolve(nonBuildBranch)
  }

  // Handle project option
  if (opts && opts.project && settings.projects && !settings.projects[opts.project]) {
    const nonProjectBranch = `${skipPrefix} - Project is a not an Alias - Project: ${opts.project}`
    console.log(chalk.blue(nonProjectBranch))
    return Promise.resolve(nonProjectBranch)
  }

  if (!FIREBASE_TOKEN) {
    const noToken = 'Error: FIREBASE_TOKEN env variable not found'
    console.log(chalk.red(noToken))
    console.log(
      chalk.blue(
        'Run firebase login:ci (from  firebase-tools) to generate a token' +
        'and place it travis environment variables as FIREBASE_TOKEN'
      )
    )
    return Promise.reject(noToken)
  }

  const onlyString = opts && opts.only ? opts.only : 'hosting'
  const project = TRAVIS_BRANCH || opts.project
  return runCommand({
    command: 'npm install --prefix ./functions',
    beforeMsg: 'Installing functions dependencies...',
    errorMsg: 'Error installing functions dependencies:',
    successMsg: 'Functions dependencies installed successfully'
  })
  .then(() => {
    console.log(`Setting Firebase project to alias ${project}`)
    return client.use(project, {}) // object needed as second arg
  })
  .then(() => {
    console.log(chalk.blue(`Successfully set Firebase project to alias ${project}`))
    return runActions(project)
  })
  .then(() => {
    console.log(chalk.blue('Deploying to Firebase...'))
    return client.deploy({
      token: FIREBASE_TOKEN,
      message: TRAVIS_COMMIT_MESSAGE || 'Recent Updates',
      project,
      cwd: process.cwd(),
      nonInteractive: true,
      only: onlyString
    })
    .catch((err) => {
      console.log(chalk.red('Error in firebase-ci:\n '), err)
      return Promise.reject(err)
    })
  })
  .then(() => console.log(chalk.blue(`Successfully Deployed to ${project}`)))
  .catch((err) => {
    console.log(chalk.red('Error in firebase-ci:\n '), err)
    return Promise.reject(err)
  })
}

export default deployToFirebase
