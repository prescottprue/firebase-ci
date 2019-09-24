import { map, get } from 'lodash';
import chalk from 'chalk';
import { error, info, warn } from '../utils/logger';
import { getFile } from '../utils/files';
import { to } from '../utils/async';
import { runCommand } from '../utils/commands';
import { getProjectKey, getFallbackProjectKey } from '../utils/ci';
import { MapEnvSettings } from '../index';

const skipPrefix = 'Skipping firebase-ci mapEnv';

/**
 * Build a string from mapEnv setting
 * @param functionsVar - Name of variable within functions
 * @param envVar - Variable within environment
 * @returns Environment set string
 */
function strFromEnvironmentVarSetting(
  functionsVar: string,
  envVar: string,
): string {
  if (!process.env[envVar]) {
    const msg = `${envVar} does not exist on within environment variables`;
    warn(msg);
    return '';
  }
  return `${functionsVar}="${process.env[envVar]}"`;
}

/**
 * Combine all functions config sets from mapEnv settings in
 * .firebaserc to a single functions config args.
 * @param mapEnvSettings - Settings for mapping environment
 * @returns Array of arguments
 */
function createConfigSetArgs(mapEnvSettings: MapEnvSettings): string[] {
  const settingsStrsArr = map(mapEnvSettings, strFromEnvironmentVarSetting);
  const settingsStr = settingsStrsArr.filter(Boolean).join(' ');
  // Get project from passed options, falling back to branch name
  const projectKey = getProjectKey(mapEnvSettings);
  const args = ['functions:config:set', settingsStr];
  return projectKey ? args.concat(['-P', projectKey]) : args;
}

/**
 * Map CI environment variables to Firebase functions config variables
 * @param copySettings - Settings for how environment variables should
 * be copied from CI environment to Firebase Functions Environment
 * @returns Resolves with undefined (result of functions config set)
 * @example
 * "ci": {
 *   "mapEnv": {
 *     "SOME_TOKEN": "some.token"
 *   }
 * }
 */
export default async function mapEnv(copySettings?: any): Promise<any> {
  // Load settings from .firebaserc
  const settings = getFile('.firebaserc');

  // Get mapEnv settings from .firebaserc, falling back to settings passed to cli
  const mapEnvSettings = get(settings, 'ci.mapEnv', copySettings);

  if (!mapEnvSettings) {
    const msg = 'mapEnv parameter with settings needed in .firebaserc!';
    warn(msg);
    return null;
  }

  // Get project from passed options, falling back to branch name
  const fallbackProjectName = getFallbackProjectKey();
  const projectKey = getProjectKey(copySettings);

  // Get project setting from settings file based on branchName falling back
  // to fallbackProjectName
  const projectName = get(settings, `projects.${projectKey}`);
  const fallbackProjectSetting = get(
    settings,
    `projects.${fallbackProjectName}`,
  );

  // Handle project option
  if (!projectName) {
    const nonProjectBranch = `${skipPrefix} - Project ${chalk.cyan(
      projectKey || '',
    )} is not an alias, checking for fallback...`;
    warn(nonProjectBranch);
    if (!fallbackProjectSetting) {
      const nonFallbackBranch = `${skipPrefix} - Fallback Project: ${chalk.cyan(
        fallbackProjectName || '',
      )} is a not an alias, exiting...`;
      warn(nonFallbackBranch);
      return nonProjectBranch;
    }
    return null;
  }

  // Create command string
  const setConfigCommandArgs = createConfigSetArgs(mapEnvSettings);
  info('Mapping Environment to Firebase Functions...');

  // Run command to set functions config
  const [configSetErr] = await to(
    runCommand({ command: 'firebase', args: setConfigCommandArgs }),
  );

  // Handle errors running functions config
  if (configSetErr) {
    const errMsg = `Error setting Firebase functions config variables from variables CI environment (mapEnv):`;
    error(errMsg, configSetErr);
    throw new Error(errMsg);
  }

  info('Successfully set functions config from variables in CI environment');
}
