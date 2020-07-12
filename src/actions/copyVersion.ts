import fs from 'fs'
import path from 'path'
import { log, info, success, error, warn } from '../utils/logger'
import { functionsExists } from '../utils/files'

/**
 * Create local path for file
 * @param {string} filePath - Path of file
 * @returns {string} File path
 */
function createPath(filePath) {
  return path.join(process.cwd(), filePath)
}

/**
 * Copy version from main package file into functions package file
 * @param {string} config - name of project
 * @param {boolean} config.silence - Whether or not to warn
 */
export default function copyVersion(config = { silence: false }) {
  if (!functionsExists()) {
    if (config.silence) {
      return
    }
    warn('Functions folder does not exist. Exiting...')
    return
  }
  info('Copying version from package.json to functions/package.json...')
  const pkg = JSON.parse(fs.readFileSync(createPath('package.json')))
  const functionsPkg = JSON.parse(
    fs.readFileSync(createPath(`functions/package.json`))
  )
  functionsPkg.version = pkg.version
  try {
    fs.writeFileSync(
      createPath(`functions/package.json`),
      JSON.stringify(functionsPkg, null, 2),
      'utf8'
    )
    success('Version copied successfully')
  } catch (err) {
    error('Error copying version to functions folder')
    log(error)
  }
}
