import chalk from 'chalk';
import { existsSync, readFileSync, readFile, writeFile } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { error } from './logger';

export const readFilePromise = promisify(readFile);
export const writeFilePromise = promisify(writeFile);

/**
 * Get settings from firebaserc file. Returns empty object if file
 * is not found and throws error if file can not be parsed as JSON.
 * @param filePath - Path of file
 * @returns File contents (JSON parsed)
 */
export function getFile(filePath: string): any {
  const localPath = path.join(process.cwd(), filePath);

  // Exit with empty object if file does not exist
  if (!existsSync(localPath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(localPath, 'utf8'));
  } catch (err) {
    error(
      `Unable to parse ${chalk.cyan(filePath)} - JSON is most likley not valid`,
    );
    throw err;
  }
}

/**
 * Get settings from firebaserc file. Returns empty object if file
 * is not found and throws error if file can not be parsed as JSON.
 * @param filePath - Path of file
 * @returns File contents (JSON parsed)
 */
export async function readJsonFile(filePath: string): Promise<any> {
  const localPath = path.join(process.cwd(), filePath);

  // Exit with empty object if file does not exist
  if (!existsSync(localPath)) {
    return {};
  }
  const fileBuffer = await readFilePromise(localPath);
  try {
    return JSON.parse(fileBuffer.toString());
  } catch (err) {
    error(
      `Unable to parse ${chalk.cyan(filePath)} - JSON is most likley not valid`,
    );
    throw err;
  }
}

/**
 * Get settings from firebaserc file. Returns empty object if file
 * is not found and throws error if file can not be parsed as JSON.
 * @param filePath - Path of file
 * @param fileContents - Contents of JSON file
 * @returns File contents (JSON parsed)
 */
export async function writeJsonFile(
  filePath: string,
  fileContents?: string | undefined,
): Promise<any> {
  const localPath = path.join(process.cwd(), filePath);
  try {
    return writeFilePromise(localPath, JSON.stringify(fileContents, null, 2));
  } catch (err) {
    error(
      `Unable to parse ${chalk.cyan(filePath)} - JSON is most likley not valid`,
    );
    throw err;
  }
}

/**
 * Check for existence of functions folder
 * @returns Whether or not functions folder exists
 */
export function functionsExists(): boolean {
  return existsSync(path.join(process.cwd(), 'functions'));
}

/**
 * Check for existence of node_modules folder within functions folder.
 * @returns Whether or not functions/node_modules folder exists
 */
export function functionsNodeModulesExist(): boolean {
  return existsSync(path.join(process.cwd(), 'functions', 'node_modules'));
}
