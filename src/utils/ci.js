export const getBranch = () => {
  const {TRAVIS_BRANCH, CIRCLE_BRANCH} = process.env
  return TRAVIS_BRANCH || CIRCLE_BRANCH
}

export const isPullRequest = () => {
  const {TRAVIS_PULL_REQUEST, CIRCLE_PR_NUMBER} = process.env
  return (!!TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== 'false') || (!!CIRCLE_PR_NUMBER && CIRCLE_PR_NUMBER !== 'false')
}

export const getCommitMessage = () => {
  const {TRAVIS_COMMIT_MESSAGE} = process.env
  return TRAVIS_COMMIT_MESSAGE
    ? TRAVIS_COMMIT_MESSAGE.replace(/"/g, '\'').substring(0, 300)
    : 'Update'
}
