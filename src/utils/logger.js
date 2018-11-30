import chalk from 'chalk'
import fig from 'figures'

const colorMapping = {
  info: 'blue',
  warn: 'yellow',
  success: 'green',
  error: 'red'
}

const iconMapping = {
  info: 'ℹ',
  warn: '⚠',
  success: '✔',
  error: '✖'
}

const logType = (type, message, other) => {
  const icon = iconMapping[type]
  const color = colorMapping[type]
  console.log(`${icon ? chalk[color](fig(icon)) : ''} ${message}`) // eslint-disable-line no-console
  if (other) {
    console.log('\n', other) // eslint-disable-line no-console
  }
}

export const log = console.log // eslint-disable-line
export const info = (message, other) => logType('info', message, other)
export const success = (message, other) => logType('success', message, other)
export const warn = (message, other) => logType('warn', message, other)
export const error = (message, other) => logType('error', message, other)
