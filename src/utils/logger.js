import chalk from 'chalk'

const colorMapping = {
  info: 'blue',
  warn: 'yellow',
  success: 'green',
  error: 'red'
}

const logType = (type, message, other) => {
  console.log(chalk[type](message)) // eslint-disable-line no-console
  if (other) {
    console.log('\n', other) // eslint-disable-line no-console
  }
}

export const log = console.log // eslint-disable-line
export const info = (message, other) =>
  logType(colorMapping.info, message, other)
export const success = (message, other) =>
  logType(colorMapping.success, message, other)
export const warn = (message, other) =>
  logType(colorMapping.warn, message, other)
export const error = (message, other) =>
  logType(colorMapping.error, message, other)
