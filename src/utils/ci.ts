import { get } from 'lodash';
import { shellescape } from './commands';
import { warn } from './logger';
import { getFile } from './files';
import { FirebaseCiOptions } from '../index';

/**
 * Get branch name from GITHUB_REF environment variable which is
 * available in Github Actions environment.
 * @returns Branch name if environment variable exists
 */
function branchNameForGithubAction(): string | undefined {
  const { GITHUB_HEAD_REF, GITHUB_REF } = process.env;
  // GITHUB_HEAD_REF for pull requests
  if (GITHUB_HEAD_REF) {
    return GITHUB_HEAD_REF;
  }
  // GITHUB_REF for commits (i.e. refs/heads/master)
  if (GITHUB_REF) {
    // replace is used in-case the value is passed and does not contain refs/heads/
    return GITHUB_REF.replace('refs/heads/', '');
  }
}

/**
 * Get the name of the current branch from environment variables
 * @returns Name of branch
 */
export function getBranch(): string {
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
  );
}

/**
 * Get the key of the project matching the branch name which is gathered from
 * from environment variables. This key is used to get the project settings
 * from .firebaserc.
 * @param opts - Options object
 * @param opts.project - Project name from options
 * @returns Key for current project
 */
export function getProjectKey(opts: FirebaseCiOptions): string | undefined {
  const branchName = getBranch();
  // Get project from passed options, falling back to branch name
  return (
    process.env.FIREBASE_CI_PROJECT ||
    // Get project from passed options, falling back to branch name
    get(opts, 'project', branchName === 'master' ? 'default' : branchName)
  );
}

/**
 * Get name of curent project from .firebaserc
 * @param opts - Options object
 * @param opts.project - Project name from options
 * @returns Name of project
 */
export function getProjectName(opts: FirebaseCiOptions): string | undefined {
  const projectKey = getProjectKey(opts);
  const firebaserc = getFile('.firebaserc');
  return get(
    firebaserc,
    `projects.${projectKey}`,
    get(firebaserc, 'projects.master'),
  );
}

/**
 * Get the key of the fallback project from environment variables. This key
 * is used to get the project settings from .firebaserc.
 * @returns Name of fallback Project
 */
export function getFallbackProjectKey(): string | undefined {
  const { CI_ENVIRONMENT_SLUG } = process.env;
  return CI_ENVIRONMENT_SLUG;
}

/**
 * Get whether or not the current ref is a pull request from environment
 * variables
 * @returns Whether or not the current ref is a pull request
 */
export function isPullRequest(): boolean {
  // Currently Bitbucket pipeline doesn't support build for PR. So doesn't include in this function.
  const { TRAVIS_PULL_REQUEST, CIRCLE_PR_NUMBER } = process.env;
  return (
    (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') ||
    (!!CIRCLE_PR_NUMBER && CIRCLE_PR_NUMBER !== 'false')
  );
}

/**
 * Get commit message from environment variables
 * @returns Commit message for current ref
 */
export function getCommitMessage(): string | undefined {
  const { TRAVIS_COMMIT_MESSAGE, CIRCLE_SHA1, CI_COMMIT_MESSAGE } = process.env;
  return TRAVIS_COMMIT_MESSAGE || CIRCLE_SHA1 || CI_COMMIT_MESSAGE;
}

/**
 * Clean deploy message for use in Firebase deploy command. Cleaning involves
 * stripping commit message to the first 150 characters, removing "`", """, and
 * running shellescape. If commit message is not found then "Update" is returned
 * @returns Deploy message
 */
export function getDeployMessage(): string | undefined {
  const originalMessage = getCommitMessage();
  const DEFAULT_DEPLOY_MESSAGE = 'Update';
  // Return "Update" (default message) if no message is gathered from env vars
  if (!originalMessage) {
    return DEFAULT_DEPLOY_MESSAGE;
  }
  try {
    // First 150 characters of commit message
    const cleanedMessage = originalMessage
      .replace(/"/g, "'")
      .replace(/`/g, '')
      .replace(/\n/g, '')
      .replace(/\t/g, '')
      .substring(0, 150);
    // Shellescape to catch any other abnormal characters
    return shellescape([cleanedMessage]);
  } catch (err) {
    warn(
      `Threw an error when trying to create deploy message, falling back to default message. Error: `,
      err,
    );
    return DEFAULT_DEPLOY_MESSAGE;
  }
}
