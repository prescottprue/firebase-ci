/* eslint-disable no-console */
import chalk from 'chalk'
import { isUndefined, reduce } from 'lodash'
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
const isPromise = (obj) => {
  return obj && typeof obj.then === 'function'
}

/**
 * @description Run a bash command using exec.
 * @param {Object} opts - Options object
 * @param {Object} opts.command - Command to be executed
 * @param {Object} opts.before - Before callback
 * @param {Object} opts.error - Error callback
 * @param {Object} opts.success - Success Callback
 * @private
 */
const runCommand = ({ command, before, error, success }) => {
  console.log('run command called:', { command, before })
  if (before) {
    before()
  }
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err !== null) {
        if (error) {
          error(err, null)
        }
        reject(err)
      } else {
        console.log(stdout) // log output
        if (success) {
          success(stdout)
        }
        resolve(stdout)
      }
    })
  })
}

/**
 * @description Create a promise that runs commands in waterfall
 * @private
 */
const createCommandsPromise = (commands) => {
  console.log('commands', commands)
  return reduce(commands, (l, r) => {
    console.log('in reduce:', { l, r, commands })
    if (!isPromise(l)) {
      return runCommand(r)
    }
    if (isPromise(runCommand(r))) {
      return l.then(runCommand(r))
    }
    return l
  }, [])
}

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
  const onlyString = only ? `--only ${only}` : ''
  const project = TRAVIS_BRANCH

  const commands = [
    {
      command: 'npm i -g firebase-tools',
      before: () => {
        console.log(chalk.blue('Installing firebase-tools...'))
      },
      success: (stdout) => {
        console.log(chalk.green('firebase-tools installed successfully'))
      },
      error: (error) => {
        console.log(chalk.red('Error installing firebase:\n', error.toString() || error))
      }
    },
    {
      command: `firebase deploy ${onlyString} --token ${FIREBASE_TOKEN} --project ${project}`,
      before: () => {
        console.log(chalk.blue('Deploying to Firebase...'))
      },
      success: (stdout) => {
        console.log(chalk.green(`Successfully Deployed to ${project}`))
      },
      error: (error) => {
        console.log(chalk.red('Error installing firebase:\n', error.toString() || error))
      }
    }
  ]

  const commandsPromise = createCommandsPromise(commands)

  commandsPromise.then(() => {
    console.log('commands executed successfully')
  })
}

export default deployToFirebase
