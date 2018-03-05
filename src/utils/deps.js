import { functionsExists } from './files'
import { runCommand } from './commands'

/**
 * Install Firebase tools and install
 * @return {[type]} [description]
 */
export const installDeps = (opts = {}) => {
  const { info } = opts
  let promises = [
    runCommand({
      command: `npm i -g firebase-tools ${info ? '' : '-q'}`,
      beforeMsg: 'Installing firebase-tools...',
      errorMsg: 'Error installing firebase-tools.',
      successMsg: 'Firebase tools installed successfully!'
    })
  ]
  if (functionsExists()) {
    promises.push(runCommand({
      command: `npm i --prefix functions`,
      beforeMsg: 'Installing firebase-tools...',
      errorMsg: 'Error installing firebase-tools.',
      successMsg: 'Firebase tools installed successfully!'
    }))
  }
  return Promise.all(promises)
}
