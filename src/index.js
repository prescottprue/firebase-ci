/* eslint-disable no-console */
import chalk from 'chalk'
import { isUndefined } from 'lodash'
const exec = require('child_process').exec
const {
  TRAVIS_BRANCH,
  TRAVIS_PULL_REQUEST,
  FIREBASE_TOKEN
} = process.env

const skipPrefix = 'Skipping Firebase Deploy'
const branchWhitelist = [
  'master',
  'stage',
  'prod'
]

/**
 * @description Deploy to Firebase under specific conditions
 * NOTE: This must remain as callbacks for stdout to be realtime
 * @private
 */
const deployToFirebase = ({ only }, cb) => {
  if (isUndefined(TRAVIS_BRANCH)) {
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

  if (branchWhitelist.indexOf(TRAVIS_BRANCH) === -1) {
    const nonBuildBranch = `${skipPrefix} - Build is a not a Build Branch - Branch: ${TRAVIS_BRANCH}`
    console.log(chalk.blue(nonBuildBranch))
    if (cb) {
      return cb(null, nonBuildBranch)
    }
    return
  }

  if (!FIREBASE_TOKEN) {
    console.log(chalk.blue('Error: FIREBASE_TOKEN env variable not found.\n' +
      'Run firebase login:ci (from  firebase-tools) to generate a token' +
      'and place it travis environment variables as FIREBASE_TOKEN'
    ))
    cb('Error: FIREBASE_TOKEN env variable not found', null)
    return
  }

  console.log(chalk.blue('Deploying to Firebase...'))

  const onlyString = only ? `--only ${only}` : ''

  exec(`firebase deploy ${onlyString} --token ${FIREBASE_TOKEN} --project ${TRAVIS_BRANCH}`, (error, stdout) => {
    if (error !== null) {
      if (cb) {
        cb(error, null)
        return
      }
    }
    if (cb) {
      cb(null, stdout)
    }
  })
}
export default deployToFirebase
