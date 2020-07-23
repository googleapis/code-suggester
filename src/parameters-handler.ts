import {Changes, CreatePullRequest, FileMode} from './types';
import {logger} from './logger';

/**
 * @param {T} elem any JavaScript element of type T
 * @returns {boolean} true if the value is null or undefined. False otherwise.
 */
function isNullOrUndefined<T>(elem: T): boolean {
  return elem === null || elem === undefined;
}

/**
 * @param {FileMode} mode the GitHub definition of file types
 * @returns {boolean} true if input is a member of the valid GitHub file mode types. Else false.
 */
function validMode(mode: FileMode): boolean {
  switch (mode) {
    case '100644':
    case '100755':
    case '040000':
    case '160000':
    case '120000':
      return true;
    default:
      logger.error(`Invalid file mode detected: ${mode}`);
      return false;
  }
}

/**
 * Validate the change object provided.
 * In JavaScript there are no types, so check up-front before starting workflow
 * @param {Changes | null |  undefined} changes the changeset
 * @returns {boolean} true if the change object is valid. False otherwise.
 */
function changeSetHasCorrectTypes(
  changes: Changes | null | undefined
): boolean {
  if (isNullOrUndefined(changes)) {
    return true;
  }
  if (typeof changes !== 'object' || isNullOrUndefined(changes?.size)) {
    return false;
  }
  for (const [path, fileData] of Object.entries(changes as Changes)) {
    if (
      !fileData.hasOwnProperty('content') ||
      !isNullOrUndefined(fileData.content) ||
      typeof fileData.content !== 'string'
    ) {
      logger.error(`Invalid file content set for: ${path}`);
      return false;
    } else if (!fileData.hasOwnProperty('mode') || validMode(fileData.mode)) {
      logger.error(`Invalid file mode set for: ${path}`);
      return false;
    }
  }
  return true;
}

/**
 * Validate the pull request config object core properties' type provided.
 * In JavaScript there are no types, so check up-front before starting workflow.
 * Returns true if all types are valid.
 * Returns false if there are any type mismatches or if there are null/undefined values.
 * @param {CreatePullRequest} configs user configurations for creating a pull request with changes
 * @returns {boolean} true if types are valid. Else false.
 */
function optionsHasCorrectTypes(configs: CreatePullRequest): boolean {
  if (
    typeof configs.upstreamOwner === 'string' &&
    typeof configs.upstreamRepo === 'string' &&
    typeof configs.message === 'string' &&
    typeof configs.description === 'string' &&
    typeof configs.title === 'string' &&
    typeof configs.branch === 'string' &&
    typeof configs.force === 'boolean' &&
    typeof configs.primary === 'string' &&
    typeof configs.maintainersCanModify === 'boolean'
  ) {
    return true;
  }
  return false;
}

/**
 * Validate the pull request config object core properties string types are not empty.
 * @param {CreatePullRequest} configs user configurations for creating a pull request with changes
 * @returns {boolean} true if any core string properties are empty strings. Else false.
 */
function hasEmptyStringOption(configs: CreatePullRequest): boolean {
  if (
    configs.upstreamOwner === '' ||
    configs.upstreamRepo === '' ||
    configs.message === '' ||
    configs.description === '' ||
    configs.title === '' ||
    configs.branch === '' ||
    configs.primary === ''
  ) {
    return true;
  }
  return false;
}

class EmtpyStringError extends Error {
  constructor(name: string) {
    super(name);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmtpyStringError);
    }
    this.name = 'EmptyStringError';
  }
}
export {
  changeSetHasCorrectTypes,
  hasEmptyStringOption,
  optionsHasCorrectTypes,
  EmtpyStringError,
  isNullOrUndefined,
};
