import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { error } from './logger'

/**
 * Get settings from firebaserc file. Returns empty object if file
 * is not found and throws error if file can not be parsed as JSON.
 * @return {Object} Firebase settings object
 */
export function getFile(filePath) {
  const localPath = path.join(process.cwd(), filePath)

  // Exit with empty object if file does not exist
  if (!fs.existsSync(localPath)) {
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'))
  } catch (err) {
    error(
      `Unable to parse ${chalk.cyan(filePath)} - JSON is most likley not valid`
    )
    throw err
  }
}

/**
 * Check for existence of functions folder
 * @return {Boolean} Whether or not functions folder exists
 */
export function functionsExists() {
  return fs.existsSync(path.join(process.cwd(), 'functions'))
}

/**
 * Check for existence of node_modules folder within functions folder.
 * @return {Boolean} Whether or not functions/node_modules folder exists
 */
export function functionsNodeModulesExist() {
  return fs.existsSync(path.join(process.cwd(), 'functions', 'node_modules'))
}
