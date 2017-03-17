/* eslint-disable no-console */
import chalk from 'chalk'
import { isUndefined } from 'lodash'
import { createCommandsPromise } from './utils/commands'
import { info, warn } from './utils/logger'

const { TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, FIREBASE_TOKEN } = process.env
const skipPrefix = 'firebase-ci: Skipping Firebase Deploy'
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
  // // TODO: Support other CI environments
  if (isUndefined(TRAVIS_BRANCH)) {
    const nonCiMessage = `${skipPrefix} - Not a supported CI environment`
    warn(nonCiMessage)
    if (cb) {
      return cb(null, nonCiMessage)
    }
    return
  }

  if (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') {
    const pullRequestMessage = `${skipPrefix} - Build is a Pull Request`
    info(pullRequestMessage)
    return cb && cb(null, pullRequestMessage)
  }

  if (branchWhitelist.indexOf(TRAVIS_BRANCH) === -1) {
    const nonBuildBranch = `${skipPrefix} - not a Build Branch`
    info(nonBuildBranch)
    return cb && cb(null, nonBuildBranch)
  }

  if (!FIREBASE_TOKEN) {
    console.log(`${chalk.bold.red('firebase-ci Error:')} ${chalk.bold('FIREBASE_TOKEN')} environment variable not found.\n` +
      'You must generate a token:\n' +
      '\t1. Make sure you have firebase-tools installed (npm install -g firebase-tools)\n' +
      '\t2. Run firebase login:ci\n' +
      `\t3. to generate a token and place it CI environment variables as ${chalk.bold('FIREBASE_TOKEN')}\n`
    )
    return cb && cb('Error: FIREBASE_TOKEN env variable not found', null)
  }

  const onlyString = only ? `--only ${only}` : ''
  const tokenString = FIREBASE_TOKEN ? `--token ${FIREBASE_TOKEN}` : ''

  // TODO: Allow custom input of project
  const project = TRAVIS_BRANCH || 'master'

  const commands = [
    {
      command: 'npm i -g firebase-tools',
      beforeMsg: 'Installing firebase-tools...',
      successMsg: 'firebase-tools installed successfully',
      errorMsg: 'Error installing firebase-tools'
    },
    {
      command: `firebase deploy ${onlyString} ${tokenString} --project ${project}`,
      beforeMsg: 'Deploying to Firebase...',
      successMsg: `Successfully Deployed to ${project}`,
      errorMsg: 'Error deploying to Firebase'
    }
  ]

  const commandsPromise = createCommandsPromise(commands)

  commandsPromise.then(() => {
    cb && cb(null, 'Success!')
  })
  .catch((err) => {
    cb && cb(err)
  })
}

export default deployToFirebase
