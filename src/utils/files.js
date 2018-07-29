import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

/**
 * Get settings from firebaserc file
 * @return {Object} Firebase settings object
 */
export const getFile = filePath => {
  const localPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(localPath)) {
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'))
  } catch (err) {
    /* eslint-disable no-console */
    console.log(
      chalk.red(`Error parsing ${filePath}.`),
      'JSON is most likley not valid'
    )
    /* eslint-enable no-console */
    return {}
  }
}

export function functionsExists() {
  return fs.existsSync(path.join(process.cwd(), 'functions'))
}

export function functionsNodeModulesExist() {
  return fs.existsSync(path.join(process.cwd(), 'functions', 'node_modules'))
}
