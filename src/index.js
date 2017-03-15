/* eslint-disable no-console */
const chalk = require('chalk')
const exec = require('child_process').exec

const { TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, FIREBASE_TOKEN } = process.env

const deployToFirebase = (cb) => {
  if (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') {
    console.log(chalk.blue('Skipping Firebase Deploy - Build is a Pull Request'))
    return
  }

  if (TRAVIS_BRANCH !== 'prod' && TRAVIS_BRANCH !== 'stage' && TRAVIS_BRANCH !== 'master') {
    console.log(chalk.blue('Skipping Firebase Deploy - Build is a not a Build Branch', TRAVIS_BRANCH))
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

  exec(`firebase deploy --token ${FIREBASE_TOKEN} --project ${TRAVIS_BRANCH}`, (error, stdout) => {
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

(function () {
  deployToFirebase((err, stdout) => {
    if (err || !stdout) {
      console.log(chalk.blue('error deploying to Firebase: ', err))
      return
    }
    console.log(chalk.blue(stdout)) // log output of firebase cl)i
    console.log(chalk.blue('\nSuccessfully deployed to Firebase'))
  })
})()
