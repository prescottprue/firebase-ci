import chalk from 'chalk';
import fig from 'figures';

type LogLevel = 'log' | 'info' | 'warn' | 'success' | 'error';

const colorMapping = {
  success: 'green',
  warn: 'yellow',
  error: 'red'
};

const iconMapping = {
  info: 'ℹ',
  warn: '⚠',
  success: '✔',
  error: '✖'
};

const prefixMapping = {
  warn: 'Warning: ',
  error: 'Error: '
};

function colorLogger(type: LogLevel) {
  const color = colorMapping[type];
  return (text: string) => {
    const chalkColor = chalk[color];
    return chalkColor ? chalkColor(text) : text;
  };
}

function logType(type, message, other) {
  const icon = iconMapping[type];
  const prefix = prefixMapping[type];
  const colorLog = colorLogger(type);
  /* eslint-disable no-console */
  console.log(
    `${icon ? colorLog(fig(icon)) : ''} ${
      prefix ? colorLog(prefix) : ''
    }${message}`
  );
  /* eslint-enable no-console */
  if (other) {
    console.log('\n', other); // eslint-disable-line no-console
  }
}

export const log = console.log; // eslint-disable-line
export const info = (message: string, other?: any) =>
  logType('info', message, other);
export const success = (message: string, other?: any) =>
  logType('success', message, other);
export const warn = (message: string, other?: any) =>
  logType('warn', message, other);
export const error = (message: string, other?: any) =>
  logType('error', message, other);
