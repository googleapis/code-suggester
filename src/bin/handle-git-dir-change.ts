// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {execSync} from 'child_process';
import {Changes, FileMode, FileData, FileDiffContent} from '../types';
import {logger} from '../logger';
import {readFile} from 'fs';
import * as path from 'path';

// data about a file in a git directory
interface GitFileData {
  path: string;
  fileData: FileData;
}

// See https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-git-diff-filesltpatterngt82308203
type GitDiffStatus = 'A' | 'D' | 'M' | 'T' | 'U' | 'X' | string;

class InstallationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstallationError';
  }
}

/**
 * Get the absolute path of a relative path
 * @param {string} dir the wildcard directory containing git change, not necessarily the root git directory
 * @returns {string} the absolute path relative to the path that the user executed the bash command in
 */
export function resolvePath(dir: string) {
  const absoluteDir = path.resolve(process.cwd(), dir);
  return absoluteDir;
}

/**
 * Get the git root directory.
 * Errors if the directory provided is not a git directory.
 * @param {string} dir an absolute directory
 * @returns {string} the absolute path of the git directory root
 */
export function findRepoRoot(dir: string): string {
  try {
    return execSync('git rev-parse --show-toplevel', {cwd: dir})
      .toString()
      .trimRight(); // remove the trailing \n
  } catch (err) {
    logger.error(`The directory provided is not a git directory: ${dir}`);
    throw err;
  }
}

/**
 * Returns the git diff old/new mode, status, and path. Given a git diff.
 * Errors if there is a parsing error
 * @param {string} gitDiffPattern A single file diff. Renames and copies are broken up into separate diffs. See https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-git-diff-filesltpatterngt82308203 for more details
 * @returns indexable git diff fields: old/new mode, status, and path
 */
function parseGitDiff(
  gitDiffPattern: string
): {
  oldMode: FileMode;
  newMode: FileMode;
  status: GitDiffStatus;
  relativePath: string;
} {
  try {
    const fields: string[] = gitDiffPattern.split(' ');
    const newMode = fields[1] as FileMode;
    const oldMode = fields[0].substring(1) as FileMode;
    const statusAndPath = fields[4].split('\t');
    const status = statusAndPath[0] as GitDiffStatus;
    const relativePath = statusAndPath[1];
    return {oldMode, newMode, status, relativePath};
  } catch (err) {
    logger.warning(
      `\`git diff --raw\` may have changed formats: \n ${gitDiffPattern}`
    );
    throw err;
  }
}

/**
 * Get the GitHub mode, file content, and relative path asynchronously
 * Rejects if there is a git diff error, or if the file contents could not be loaded.
 * @param {string} gitRootDir the root of the local GitHub repository
 * @param {string} gitDiffPattern A single file diff. Renames and copies are broken up into separate diffs. See https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-git-diff-filesltpatterngt82308203 for more details
 * @returns {Promise<GitFileData>} the current mode, the relative path of the file in the Git Repository, and the file status.
 */
export function getGitFileData(
  gitRootDir: string,
  gitDiffPattern: string
): Promise<GitFileData> {
  return new Promise((resolve, reject) => {
    try {
      const {oldMode, newMode, status, relativePath} = parseGitDiff(
        gitDiffPattern
      );
      // if file is deleted, do not attempt to read it
      if (status === 'D') {
        resolve({path: relativePath, fileData: new FileData(null, oldMode)});
      } else {
        // else read the file
        readFile(
          gitRootDir + '/' + relativePath,
          {
            encoding: 'utf-8',
          },
          (err, content) => {
            if (err) {
              logger.error(
                `Error loading file ${relativePath} in git directory ${gitRootDir}`
              );
              reject(err);
            }
            resolve({
              path: relativePath,
              fileData: new FileData(content, newMode),
            });
          }
        );
      }
    } catch (err) {
      reject(err);
    }
  });
}

function getFileContentsAtHead(gitRootDir: string, filePath: string) : string {
  return execSync(`git show HEAD:${filePath}`, {cwd: gitRootDir}).toString();
}

/**
 * Get all the diffs using `git diff` of a git directory.
 * Errors if the git directory provided is not a git directory.
 * @param {string} gitRootDir a git directory
 * @returns {string[]} a list of git diffs
 */
export function getAllDiffs(gitRootDir: string): string[] {
  execSync('git add -A', {cwd: gitRootDir});
  const diffs: string[] = execSync('git diff --raw --staged --no-renames', {
    cwd: gitRootDir,
  })
    .toString() // strictly return buffer for mocking purposes. sinon ts doesn't infer {encoding: 'utf-8'}
    .trimRight() // remove the trailing new line
    .split('\n');
  return diffs;
}

/**
 * Get the git changes of the current project asynchronously.
 * Rejects if any of the files fails to load (if not deleted),
 * or if there is a git diff parse error
 * @param {string[]} diffs the git diff raw output (which only shows relative paths)
 * @param {string} gitDir the root of the local GitHub repository
 * @returns {Promise<Changes>} the changeset
 */
export async function parseChanges(
  diffs: string[],
  gitDir: string
): Promise<Changes> {
  try {
    // get updated file contents
    const changes: Changes = new Map();
    const changePromises: Array<Promise<GitFileData>> = [];
    for (let i = 0; i < diffs.length; i++) {
      // TODO - handle memory constraint
      changePromises.push(getGitFileData(gitDir, diffs[i]));
    }
    const gitFileDatas = await Promise.all(changePromises);
    for (let i = 0; i < gitFileDatas.length; i++) {
      changes.set(gitFileDatas[i].path, gitFileDatas[i].fileData);
    }
    return changes;
  } catch (err) {
    logger.error('Error parsing git changes');
    throw err;
  }
}

/**
 * Throws an error if git is not installed
 * @returns {void} void if git is installed
 */
function validateGitInstalled(): void {
  try {
    execSync('git --version');
  } catch (err) {
    logger.error('git not installed');
    throw new InstallationError(
      'git command is not recognized. Make sure git is installed.'
    );
  }
}

/**
 * Load the change set asynchronously.
 * @param dir the directory containing git changes
 * @returns {Promise<Changes>} the change set
 */
export function getChanges(dir: string): Promise<Changes> {
  try {
    validateGitInstalled();
    const absoluteDir = resolvePath(dir);
    const gitRootDir = findRepoRoot(absoluteDir);
    const diffs = getAllDiffs(gitRootDir);
    return parseChanges(diffs, gitRootDir);
  } catch (err) {
    if (!(err instanceof InstallationError)) {
      logger.error('Error loadng git changes.');
    }
    throw err;
  }
}

/**
 * Get the git changes of the current project asynchronously.
 * Rejects if any of the files fails to load (if not deleted),
 * or if there is a git diff parse error
 * @param {string[]} diffs the git diff raw output (which only shows relative paths)
 * @param {string} gitDir the root of the local GitHub repository
 * @returns {Promise<Changes>} the changeset
 */
export async function parseDiffContents(
  diffs: string[],
  gitDir: string
): Promise<Map<string, FileDiffContent>> {
  try {
    // get updated file contents
    const changes: Map<string, FileDiffContent> = new Map();
    const changePromises: Array<Promise<GitFileData>> = [];
    for (let i = 0; i < diffs.length; i++) {
      // TODO - handle memory constraint
      changePromises.push(getGitFileData(gitDir, diffs[i]));
    }
    const gitFileDatas = await Promise.all(changePromises);
    for (let i = 0; i < gitFileDatas.length; i++) {
      const gitfileData = gitFileDatas[i];
      const fileDiffContent: FileDiffContent = {
        oldContent: getFileContentsAtHead(gitDir, gitfileData.path),
        newContent: gitfileData.fileData.content!,
      };
      changes.set(gitfileData.path, fileDiffContent);
    }
    return changes;
  } catch (err) {
    logger.error('Error parsing git changes');
    throw err;
  }
}

export function getDiffContents(dir: string): Promise<Map<string, FileDiffContent>> {
  try {
    validateGitInstalled();
    const absoluteDir = resolvePath(dir);
    const gitRootDir = findRepoRoot(absoluteDir);
    const diffs = getAllDiffs(gitRootDir);
    return parseDiffContents(diffs, gitRootDir);
  } catch (err) {
    if (!(err instanceof InstallationError)) {
      logger.error('Error loadng git changes.');
    }
    throw err;
  }
}
