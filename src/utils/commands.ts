/* eslint-disable no-console */
import { Writable } from 'stream';
import { spawn } from 'child_process';
import { info } from './logger';

process.env.FORCE_COLOR = 'true';

/**
 * Check to see if the provided value is a promise object
 * @param valToCheck - Value to be checked for Promise qualities
 * @returns Whether or not provided value is a promise
 */
export function isPromise(valToCheck: any): boolean {
  return valToCheck && typeof valToCheck.then === 'function';
}

export interface RunCommandOptions {
  command: string;
  args: string[] | any;
  beforeMsg?: string;
  successMsg?: string;
  errorMsg?: string;
  pipeOutput?: boolean;
}

/**
 * Run a bash command using spawn pipeing the results to the main process
 * @param runOptions - Options object for command run
 * @returns Resolves with results of running the command
 * @private
 */
export function runCommand(runOptions: RunCommandOptions): Promise<any> {
  const {
    beforeMsg,
    successMsg,
    command,
    errorMsg,
    args,
    pipeOutput = true,
  } = runOptions;
  if (beforeMsg) info(beforeMsg);
  return new Promise((resolve, reject): void => {
    const child = spawn(command, args);
    let output: any;
    let error: any;
    const customStream = new Writable();
    const customErrorStream = new Writable();
    /* eslint-disable no-underscore-dangle */
    customStream._write = (data, ...argv): void => {
      output += data;
      if (pipeOutput) {
        process.stdout._write(data, ...argv);
      }
    };
    customErrorStream._write = (data, ...argv): void => {
      error += data;
      if (pipeOutput) {
        process.stderr._write(data, ...argv);
      }
    };
    /* eslint-enable no-underscore-dangle */
    // Pipe errors and console output to main process
    child.stdout.pipe(customStream);
    child.stderr.pipe(customErrorStream);
    // When child exits resolve or reject based on code
    child.on('exit', (code: number): void => {
      if (code !== 0) {
        // Resolve for npm warnings
        if (output && output.indexOf('npm WARN') !== -1) {
          return resolve(successMsg || output);
        }
        if (errorMsg) {
          console.log(errorMsg); // eslint-disable-line no-console
        }
        reject(error || output);
      } else {
        // resolve(null, stdout)
        if (successMsg) info(successMsg);
        // Remove leading undefined from response
        if (output && output.indexOf('undefined') === 0) {
          resolve(successMsg || output.replace('undefined', ''));
        } else {
          resolve(successMsg || output);
        }
      }
    });
  });
}

/**
 * Escape shell command arguments and join them to a single string
 * @param a - List of arguments to escape
 * @returns Command string with arguments escaped
 */
export function shellescape(a: string[]): string {
  const ret: string[] = [];

  a.forEach(s => {
    if (/[^A-Za-z0-9_/:=-]/.test(s)) {
      // eslint-disable-line no-useless-escape
      s = `'${s.replace(/'/g, "'\\''")}'`; // eslint-disable-line no-param-reassign
      s = s // eslint-disable-line no-param-reassign
        .replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    ret.push(s);
  });

  return ret.join(' ');
}
