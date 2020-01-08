import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { reduce, template, mapValues, get } from 'lodash';
import { getFile } from '../utils/files';
import { error, info, warn } from '../utils/logger';
import { getProjectKey } from '../utils/ci';

const { CI_ENVIRONMENT_SLUG } = process.env;
export type FunctionsConfigPath = string;
export interface CreateConfigSettings {
  [envVarName: string]: FunctionsConfigPath;
}

/**
 * Format message from error object
 * @param err - Error from which to get message
 * @returns Formatted error message
 */
function formattedErrorMessage(err: Error): string {
  const errMessage = get(err, 'message', 'Issue templating config file');
  if (!errMessage.includes('is not defined')) {
    return errMessage;
  }
  const splitMessage = err.message.split(' is not defined');
  return `${chalk.cyan(splitMessage[0])} is not defined in environment`;
}

/**
 * Try templating a string with the current environment
 * @param str - String to template
 * @param name - Name of template variable
 * @returns Templated string
 */
function tryTemplating(str: string, name: string): string {
  const { version } = getFile('package.json');
  try {
    return template(str)({
      ...process.env,
      version,
      npm_package_version: version, // eslint-disable-line @typescript-eslint/camelcase
    });
  } catch (err) {
    const errMsg = formattedErrorMessage(err);
    warn(`${errMsg}. Setting ${chalk.cyan(name)} to an empty string.`);
    return '';
  }
}

/**
 * Convert object into formatted object string
 * @param parent - Parent variable
 * @returns Stringified parent variable name and value
 */
function parentAsString(parent: any): string {
  return reduce(
    parent,
    (acc, child, childKey) =>
      acc.concat(`  ${childKey}: ${JSON.stringify(child, null, 2)},\n`),
    '',
  );
}

/**
 * Create config file based on CI environment variables
 * @param config - Settings for how environment variables should
 * be copied from Travis-CI to Firebase Functions Config
 * @param config.path - Path where config file should be written
 * @example
 * "ci": {
 *   "createConfig": {
 *     "prod": {
 *        "firebase": {
 *          "apiKey": "${PROD_FIREBASE_API_KEY}"
 *        }
 *     }
 *   }
 * }
 * @private
 */
export default function createConfigFile(config?: any): void {
  const settings = getFile('.firebaserc');

  // Check for .firebaserc settings file
  if (!settings) {
    error('.firebaserc file is required');
    throw new Error('.firebaserc file is required');
  }

  // Check for ci section of settings file
  if (!settings.ci || !settings.ci.createConfig) {
    error('no createConfig settings found');
    return;
  }

  // Set options object for later use (includes path for config file)
  const opts = {
    path: get(config, 'path', './src/config.js'),
    project: getProjectKey(config),
  };

  // Get environment config from settings file based on settings or branch
  // default is used if TRAVIS_BRANCH env not provided, master used if default not set
  const {
    ci: { createConfig },
  } = settings;

  // Fallback to different project name
  const fallBackConfigName =
    CI_ENVIRONMENT_SLUG || (createConfig.master ? 'master' : 'default');

  const envConfig =
    (typeof opts.project === 'string' && createConfig[opts.project]) ||
    createConfig[fallBackConfigName];

  if (!envConfig) {
    const msg = 'Valid create config settings could not be loaded';
    error(msg);
    throw new Error(msg);
  }

  info(
    `Creating config file at ${chalk.cyan(opts.path)} for project: ${chalk.cyan(
      typeof opts.project === 'string' && createConfig[opts.project]
        ? opts.project
        : fallBackConfigName,
    )}`,
  );

  // template data based on environment variables
  const templatedData = mapValues(envConfig, (parent: string, parentName) =>
    typeof parent === 'string'
      ? tryTemplating(parent, parentName)
      : mapValues(parent, (data, childKey) =>
          tryTemplating(data, `${parentName}.${childKey}`),
        ),
  );

  // combine all stringified vars and attach default export
  const exportString =
    path.extname(opts.path) === '.json'
      ? JSON.stringify(templatedData, null, 2)
      : reduce(
          templatedData,
          (acc, parent, parentName) =>
            acc
              .concat(`export const ${parentName} = `)
              .concat(
                typeof parent === 'string' || (parent as any) instanceof String
                  ? `"${parent}";\n\n`
                  : `{\n${parentAsString(parent)}};\n\n`,
              ),
          '',
        ).concat(`export default { ${Object.keys(templatedData).join(', ')} }`);

  const folderName = path.basename(path.dirname(opts.path));

  // Add folder containing config file if it does not exist
  if (!fs.existsSync(`./${folderName}`)) {
    fs.mkdirSync(folderName);
  }

  // Write config file
  try {
    fs.writeFileSync(opts.path, exportString, 'utf8');
  } catch (err) {
    error('Error creating config file: ', err);
  }
}
