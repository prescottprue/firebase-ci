/* eslint-disable no-console */
import chalk from 'chalk'
import fs from 'fs'
import { isUndefined } from 'lodash'
import { runCommand } from './utils/commands'
const {
  TRAVIS_BRANCH,
  TRAVIS_PULL_REQUEST,
  FIREBASE_TOKEN
} = process.env

const skipPrefix = 'Skipping Firebase Deploy'

/**
 * Get settings from firebaserc file
 * @return {Object} Firebase settings object
 */
const getSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(`./.firebaserc`, 'utf8'))
  } catch (err) {
    console.log(chalk.red('.firebaserc file does not exist!'))
    return {}
  }
}

const settings = getSettings()

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
 * @description Deploy to Firebase under specific conditions
 * @param {Object} opts - Options object
 * @param {String} opts.only - String corresponding to list of entities
 * to deploy (hosting, functions, database)
 * @param {Function} cb - Callback called when complete (err, stdout)
 * @private
 */
const deployToFirebase = (opts, cb) => {
  if (isUndefined(TRAVIS_BRANCH) || (opts && opts.test)) {
    const nonCiMessage = `${skipPrefix} - Not a supported CI environment`
    console.log(chalk.blue(nonCiMessage))
    if (cb) {
      return cb(null, nonCiMessage)
    }
    return
  }

  if (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') {
    const pullRequestMessage = `${skipPrefix} - Build is a Pull Request`
    console.log(chalk.blue(pullRequestMessage))
    if (cb) {
      return cb(null, pullRequestMessage)
    }
    return
  }

  if (settings.projects && !settings.projects[TRAVIS_BRANCH]) {
    const nonBuildBranch = `${skipPrefix} - Branch is a not a Build Branch - Branch: ${TRAVIS_BRANCH}`
    console.log(chalk.blue(nonBuildBranch))
    if (cb) {
      return cb(null, nonBuildBranch)
    }
    return
  }

  // Handle project option
  if (opts && opts.project && settings.projects && !settings.projects[opts.project]) {
    const nonBuildBranch = `${skipPrefix} - Project is a not an Alias - Project: ${opts.project}`
    console.log(chalk.blue(nonBuildBranch))
    if (cb) {
      return cb(null, nonBuildBranch)
    }
    return
  }

  if (!FIREBASE_TOKEN) {
    console.log(chalk.red('Error: FIREBASE_TOKEN env variable not found.'))
    console.log(
      chalk.blue(
        'Run firebase login:ci (from  firebase-tools) to generate a token' +
        'and place it travis environment variables as FIREBASE_TOKEN'
      )
    )
    cb('Error: FIREBASE_TOKEN env variable not found', null)
    return
  }

  let promises = [
    runCommand({
      command: `npm i -g firebase-tools`,
      beforeMsg: 'Installing firebase-tools...',
      errorMsg: 'Error installing firebase-tools.',
      afterMsg: 'Firebase tools installed successfully'
    })
  ]
  const onlyString = opts && opts.only ? `--only ${opts.only}` : ''
  const project = TRAVIS_BRANCH
  if (fs.existsSync('functions')) {
    if (settings.functions && settings.functions.copyVersion) {
      copyVersion()
    }
    promises.push(
      runCommand({
        command: 'npm install --prefix ./functions',
        beforeMsg: 'Installing functions dependencies...',
        errorMsg: 'Error installing functions dependencies:',
        afterMsg: 'Functions dependencies installed successfully'
      })
    )
  }
  return Promise.all(promises)
    .then(() => {
      // Wait until all other commands are complete before calling deploy
      return runCommand({
        command: `firebase deploy ${onlyString} --token ${FIREBASE_TOKEN} --project ${project}`,
        beforeMsg: 'Deploying to Firebase...',
        errorMsg: 'Error deploying to firebase:',
        afterMsg: `Successfully Deployed to ${project}`
      }).then(() => {
        cb(null, {})
      })
    })
    .catch((err) => {
      cb(err, null)
      return Promise.reject(err)
    })
}

export default deployToFirebase
