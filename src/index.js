/* eslint-disable no-console */
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
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

  console.log(chalk.blue('Installing firebase-tools...'))

  const onlyString = only ? `--only ${only}` : ''
  const project = TRAVIS_BRANCH
  exec(`npm i -g firebase-tools`, (error, stdout) => {
    if (error !== null) {
      console.log(chalk.red('Error deploying to firebase.'), error ? error.toString() : stdout)
      if (cb) {
        cb(error, null)
        return
      }
    }
    // TODO: Install functions npm depdendencies if folder exists
    if (fs.existsSync(path.join(__dirname, '..', 'functions'))) {
      console.log(chalk.green('functions folder exists'))
    } else {
      console.log(chalk.green('functions folder does not exist'))
    }
    // TODO: Do not attempt to install functions depdendencies if folder does not exist
    console.log(stdout) // log output
    console.log(chalk.green('firebase-tools installed successfully'))
    console.log(chalk.blue('Deploying to Firebase...'))
    exec(`firebase deploy ${onlyString} --token ${FIREBASE_TOKEN} --project ${project}`, (error, stdout) => {
      if (error !== null) {
        console.log(chalk.red('Error deploying to firebase: '), error ? error.toString() : stdout)
        if (cb) {
          cb(error, null)
          return
        }
      }
      console.log(stdout) // log output
      console.log(chalk.green(`Successfully Deployed to ${project}`))
      if (cb) {
        cb(null, stdout)
      }
    })
  })
}
export default deployToFirebase
