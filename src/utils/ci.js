export const getBranch = () => {
  const {TRAVIS_BRANCH, CIRCLE_BRANCH, BITBUCKET_BRANCH} = process.env
  return TRAVIS_BRANCH || CIRCLE_BRANCH || BITBUCKET_BRANCH
}

export const isPullRequest = () => {
  // Currently Bitbucket pipeline doesn't support build for PR. So doesn't include in this function.
  const {TRAVIS_PULL_REQUEST, CIRCLE_PR_NUMBER} = process.env
  return (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') || (!!CIRCLE_PR_NUMBER && CIRCLE_PR_NUMBER !== 'false')
}

export const getCommitMessage = () => {
  const {TRAVIS_COMMIT_MESSAGE} = process.env
  return TRAVIS_COMMIT_MESSAGE
    ? TRAVIS_COMMIT_MESSAGE.replace(/"/g, '\'').substring(0, 300)
    : 'Update'
}
