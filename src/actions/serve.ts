import { get } from 'lodash';
import chalk from 'chalk';
import { error, info, warn } from '../utils/logger';
import { getFile } from '../utils/files';
import { to } from '../utils/async';
import { runCommand } from '../utils/commands';
import { getProjectKey, getFallbackProjectKey } from '../utils/ci';
import { FirebaseCiOptions } from '../index';

const skipPrefix = 'Skipping firebase-ci serve';

/**
 * Serve specific project
 * @param {object} opts - Settings for serving
 * @returns {Promise} Resolves after serve is called
 */
export default async function serve(opts: FirebaseCiOptions): Promise<any> {
  // Load settings from .firebaserc
  const settings = getFile('.firebaserc');

  // Get project from passed options, falling back to branch name
  const fallbackProjectName = getFallbackProjectKey();
  const projectKey = getProjectKey(opts);

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
      projectKey,
    )} is not an alias, checking for fallback...`;
    warn(nonProjectBranch);
    if (!fallbackProjectSetting) {
      const nonFallbackBranch = `${skipPrefix} - Fallback Project: ${chalk.cyan(
        fallbackProjectName,
      )} is a not an alias, exiting...`;
      warn(nonFallbackBranch);
      return nonProjectBranch;
    }
    return null;
  }

  info(
    `Calling serve for project ${chalk.cyan(projectName)} (alias ${chalk.cyan(
      projectKey,
    )})`,
  );

  const serveArgs = ['serve', '-P', projectKey];
  const onlyString = opts && opts.only ? `--only ${opts.only}` : '';
  if (onlyString) {
    serveArgs.push(onlyString);
  }

  // Run command to set functions config
  const [serveErr] = await to(
    runCommand({
      command: 'firebase',
      args: serveArgs,
    }),
  );

  // Handle errors running functions config
  if (serveErr) {
    const errMsg = `Error calling serve for ${chalk.cyan(
      projectName,
    )} (alias ${chalk.cyan(projectKey)}) :`;
    error(errMsg, serveErr);
    throw new Error(errMsg);
  }

  info(
    `Successfully called serve for project ${chalk.cyan(
      projectName,
    )} (alias ${chalk.cyan(projectKey)})`,
  );
}
