import { get } from 'lodash'
import { shellescape } from './commands'
import { warn } from '../utils/logger'

/**
 * Get the name of the current branch from environment variables
 * @return {String} Name of branch
 */
export function getBranch() {
  const {
    TRAVIS_BRANCH,
    CIRCLE_BRANCH,
    BITBUCKET_BRANCH,
    CI_COMMIT_REF_SLUG
  } = process.env
  return (
    TRAVIS_BRANCH ||
    CIRCLE_BRANCH ||
    BITBUCKET_BRANCH ||
    CI_COMMIT_REF_SLUG ||
    'master'
  )
}

/**
 * Get the name of the project from environment variables
 * @param  {Object} opts - Options object
 * @param  {Object} opts.project - Project name from options
 * @return {String} Name of project
 */
export function getProjectName(opts) {
  const branchName = getBranch()
  const { FIREBASE_CI_PROJECT } = process.env
  // Get project from passed options, falling back to branch name
  return (
    FIREBASE_CI_PROJECT ||
    get(opts, 'project', branchName === 'master' ? 'default' : branchName)
  )
}

/**
 * Get the name of the fallback project from environment variables
 * @return {String} Name of fallback Project
 */
export function getFallbackProjectName() {
  const { CI_ENVIRONMENT_SLUG } = process.env
  return CI_ENVIRONMENT_SLUG
}

/**
 * Get whether or not the current ref is a pull request from environment
 * variables
 * @return {Boolean} Whether or not the current ref is a pull request
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
 * @return {String} Commit message for current ref
 */
export function getCommitMessage() {
  const { TRAVIS_COMMIT_MESSAGE, CIRCLE_SHA1, CI_COMMIT_MESSAGE } = process.env
  return TRAVIS_COMMIT_MESSAGE || CIRCLE_SHA1 || CI_COMMIT_MESSAGE
}

/**
 * Clean deploy message for use in Firebase deploy command. Cleaning involves
 * stripping commit message to the first 150 characters, removing "`", """, and
 * running shellescape. If commit message is not found then "Update" is returned
 * @return {String}
 */
export function getDeployMessage() {
  const originalMessage = getCommitMessage()
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
