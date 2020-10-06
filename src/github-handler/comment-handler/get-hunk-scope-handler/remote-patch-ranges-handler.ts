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

import {Octokit} from '@octokit/rest';
import {RepoDomain, Hunk} from '../../../types';
import {logger} from '../../../logger';
import {parsePatch} from '../../diff-utils';

/**
 * For a pull request, get each remote file's patch text asynchronously
 * Also get the list of files whose patch data could not be returned
 * @param {Octokit} octokit the authenticated octokit instance
 * @param {RepoDomain} remote the remote repository domain information
 * @param {number} pullNumber the pull request number
 * @param {number} pageSize the number of results to return per page
 * @returns {Promise<Object<PatchText, string[]>>} the stringified patch data for each file and the list of files whose patch data could not be resolved
 */
export async function getCurrentPullRequestPatches(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number
): Promise<{patches: Map<string, string>; filesMissingPatch: string[]}> {
  // TODO: support pagination
  const filesMissingPatch: string[] = [];
  const files = (
    await octokit.pulls.listFiles({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    })
  ).data;
  const patches: Map<string, string> = new Map<string, string>();
  if (files.length === 0) {
    logger.error(
      `0 file results have returned from list files query for Pull Request #${pullNumber}. Cannot make suggestions on an empty Pull Request`
    );
    throw Error('Empty Pull Request');
  }
  files.forEach(file => {
    if (file.patch === undefined) {
      // files whose patch is too large do not return the patch text by default
      // TODO handle file patches that are too large
      logger.warn(
        `File ${file.filename} may have a patch that is too large to display patch object.`
      );
      filesMissingPatch.push(file.filename);
    } else {
      patches.set(file.filename, file.patch);
    }
  });
  if (patches.size === 0) {
    logger.warn(
      '0 patches have been returned. This could be because the patch results were too large to return.'
    );
  }
  return {patches, filesMissingPatch};
}

/**
 * For a pull request, get each remote file's current patch range to identify the scope of each patch as a Map.
 * @param {Octokit} octokit the authenticated octokit instance
 * @param {RepoDomain} remote the remote repository domain information
 * @param {number} pullNumber the pull request number
 * @param {number} pageSize the number of files to return per pull request list files query
 * @returns {Promise<Map<string, Hunk[]>>} the scope of each file in the pull request
 */
export async function getPullRequestHunks(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number
): Promise<Map<string, Hunk[]>> {
  const files = (
    await octokit.pulls.listFiles({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    })
  ).data;
  const pullRequestHunks: Map<string, Hunk[]> = new Map();
  if (files.length === 0) {
    logger.error(
      `0 file results have returned from list files query for Pull Request #${pullNumber}. Cannot make suggestions on an empty Pull Request`
    );
    throw Error('Empty Pull Request');
  }
  files.forEach(file => {
    if (file.patch === undefined) {
      // files whose patch is too large do not return the patch text by default
      // TODO handle file patches that are too large
      logger.warn(
        `File ${file.filename} may have a patch that is too large to display patch object.`
      );
    } else {
      const hunks = parsePatch(file.patch);
      pullRequestHunks.set(file.filename, hunks);
    }
  });
  if (pullRequestHunks.size === 0) {
    logger.warn(
      '0 patches have been returned. This could be because the patch results were too large to return.'
    );
  }
  return pullRequestHunks;
}
