import { get } from 'lodash'
import { shellescape, runCommand } from './commands'
import { warn, error } from './logger'
import { getFile } from './files'

/**
 * Get branch name from GITHUB_REF environment variable which is
 * available in Github Actions environment.
 * @returns {string|undefined} Branch name if environment variable exists
 */
function branchNameForGithubAction() {
  const { GITHUB_HEAD_REF, GITHUB_REF } = process.env
  // GITHUB_HEAD_REF for pull requests
  if (GITHUB_HEAD_REF) {
    return GITHUB_HEAD_REF
  }
  // GITHUB_REF for commits (i.e. refs/heads/master)
  if (GITHUB_REF) {
    // replace is used in-case the value is passed and does not contain refs/heads/
    return GITHUB_REF.replace('refs/heads/', '')
  }
}

/**
 * Get the name of the current branch from environment variables
 * @returns {string} Name of branch
 */
export function getBranch() {
  return (
    branchNameForGithubAction() || // github actions
    process.env.CI_COMMIT_REF_SLUG || // gitlab-ci
    process.env.TRAVIS_BRANCH || // travis-ci
    process.env.CIRCLE_BRANCH || // circle-ci
    process.env.WERCKER_GIT_BRANCH || // wercker
    process.env.DRONE_BRANCH || // drone-ci
    process.env.CI_BRANCH || // codeship
    process.env.BITBUCKET_BRANCH || // bitbucket
    'master'
  )
}

/**
 * Get the key of the project matching the branch name which is gathered from
 * from environment variables. This key is used to get the project settings
 * from .firebaserc.
 * @param {object} opts - Options object
 * @param {object} opts.project - Project name from options
 * @returns {string} Name of project
 */
export function getProjectKey(opts) {
  const branchName = getBranch()
  return (
    process.env.FIREBASE_CI_PROJECT ||
    // Get project from passed options, falling back to branch name
    (opts && opts.project) ||
    branchName
  )
}

/**
 * Get name of project from .firebaserc based on branch name
 * @param {object} opts - Options object
 * @param {object} opts.project - Project name from options
 * @returns {string} Name of project
 */
export function getProjectName(opts) {
  const projectKey = getProjectKey(opts)
  const firebaserc = getFile('.firebaserc')
  return (
    get(firebaserc, `projects.${projectKey}`) ||
    (opts &&
      opts.defaultProject &&
      get(firebaserc, `projects.${opts.defaultProject}`)) ||
    get(firebaserc, 'projects.master') ||
    get(firebaserc, 'projects.default')
  )
}

/**
 * Get name of project from .firebaserc based on branch name
 * @param {object} opts - Options object
 * @param {object} opts.project - Project name from options
 * @returns {string} Name of project
 */
export function getProjectId(opts) {
  const projectKey = getProjectKey(opts)
  const firebaserc = getFile('.firebaserc')
  return (
    process.env.FIREBASE_CI_PROJECT ||
    get(
      firebaserc,
      `ci.createConfig.${
        projectKey === 'default' ? 'master' : projectKey
      }.firebase.projectId`
    ) ||
    (opts &&
      opts.defaultProject &&
      get(
        firebaserc,
        `ci.createConfig.${opts.defaultProject}.firebase.projectId`
      )) ||
    get(firebaserc, `ci.createConfig.master.firebase.projectId`) ||
    getProjectName(opts)
  )
}

/**
 * Get the key of the fallback project from environment variables. This key
 * is used to get the project settings from .firebaserc.
 * @returns {string} Name of fallback Project
 */
export function getFallbackProjectKey() {
  return process.env.CI_ENVIRONMENT_SLUG
}

/**
 * Get whether or not the current ref is a pull request from environment
 * variables
 * @returns {boolean} Whether or not the current ref is a pull request
 */
export function isPullRequest() {
  // Currently Bitbucket pipeline doesn't support build for PR. So doesn't include in this function.
  const { TRAVIS_PULL_REQUEST, CIRCLE_PR_NUMBER } = process.env
  return (
    (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') ||
    (!!CIRCLE_PR_NUMBER && CIRCLE_PR_NUMBER !== 'false')
  )
}

/**
 * Get commit message from environment variables
 * @returns {string} Commit message for current ref
 */
async function getCommitMessage() {
  // Load commit message from ENV variables if not using Github Actions
  if (!process.env.GITHUB_ACTIONS) {
    return (
      process.env.TRAVIS_COMMIT_MESSAGE ||
      process.env.CI_COMMIT_MESSAGE ||
      process.env.CI_MESSAGE
    )
  }

  // Load commit message using GITHUB_SHA on Github Actions
  try {
    const commandResults = await runCommand({
      command: 'git',
      args: [
        '--no-pager',
        'log',
        '--format=%B',
        '-n',
        '1',
        process.env.GITHUB_SHA
      ]
    })
    return commandResults
  } catch (err) {
    error(
      `Error getting commit message through git log for SHA: ${process.env.GITHUB_SHA}`,
      err
    )
    return null
  }
}

/**
 * Clean deploy message for use in Firebase deploy command. Cleaning involves
 * stripping commit message to the first 150 characters, removing "`", """, and
 * running shellescape. If commit message is not found then "Update" is returned
 * @returns {string} Message for deploy
 */
export async function getDeployMessage() {
  const originalMessage = await getCommitMessage()
  const DEFAULT_DEPLOY_MESSAGE = 'Update'
  // Return "Update" (default message) if no message is gathered from env vars
  if (!originalMessage) {
    return DEFAULT_DEPLOY_MESSAGE
  }
  try {
    // First 150 characters of commit message
    const cleanedMessage = originalMessage
      .replace(/"/g, "'")
      .replace(/`/g, '')
      .replace(/\n/g, '')
      .replace(/\t/g, '')
      .substring(0, 150)
    // Shellescape to catch any other abnormal characters
    return shellescape([cleanedMessage])
  } catch (err) {
    warn(
      `Threw an error when trying to create deploy message, falling back to default message. Error: `,
      err
    )
    return DEFAULT_DEPLOY_MESSAGE
  }
}
