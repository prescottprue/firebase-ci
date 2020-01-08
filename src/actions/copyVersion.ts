import { log, info, success, error, warn } from '../utils/logger';
import { functionsExists, readJsonFile, writeJsonFile } from '../utils/files';
import { FirebaseCiOptions } from '../index';

/**
 * Copy version from main package file into functions package file
 * @param config - Options object
 * @param config.silent - Whether or not to warn
 */
export default async function copyVersion(
  config?: FirebaseCiOptions,
): Promise<any> {
  if (!functionsExists()) {
    if (config && config.silence) {
      return;
    }
    warn('Functions folder does not exist. Exiting...');
    return;
  }
  info('Copying version from package.json to functions/package.json...');
  const pkg = await readJsonFile('package.json');
  const functionsPkg = await readJsonFile('functions/package.json');
  functionsPkg.version = pkg.version;
  try {
    await writeJsonFile(`functions/package.json`, functionsPkg);
    success('Version copied successfully');
  } catch (err) {
    error('Error copying version to functions folder');
    log(error);
  }
}
