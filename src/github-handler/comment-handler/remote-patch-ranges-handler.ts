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
import {FileRanges, PatchText, Range, RepoDomain} from '../../types';
import {getGitHubPatchRanges} from './github-patch-format-handler';
import {logger} from '../../logger';

/**
 * Get each pull request remote file's patch text asynchronously
 * @param {Octokit} octokit the authenticated octokit instance
 * @param {RepoDomain} remote the remote repository domain information
 * @param {number} pullNumber the pull request number
 * @param {number} pageSize the number of results to return per page
 * @returns {Promise<Promise<Object<PatchText, string[]>>>} the stringified patch data for each file and the list of files whose patch data could not be resolved
 */
export async function getCurrentPulLRequestPatches(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number
): Promise<{patches: PatchText; filesMissingPatch: string[]}> {
  // TODO support pagination
  const filesMissingPatch: string[] = [];
  const files = (
    await octokit.pulls.listFiles({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    })
  ).data;
  const patches: PatchText = new Map<string, string>();
  if (files.length === 0) {
    logger.error(
      `0 file results have returned from list files query for Pull Request #${pullNumber}. Cannot make suggestions on an empty Pull Request`
    );
    throw Error('Empty Pull Request');
  }
  files.forEach(file => {
    if (file.patch === undefined) {
      // files that are too large do not return the patch text by default
      // TODO handle files that are too large
      logger.warn(
        `File ${file.filename} is too large to display patch object.`
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
 * Given the patch text (for a whole file) for each file,
 * get each file's hunk's (part of a file's) range
 * @param {PatchText} validPatches patch text from the remote github file
 * @returns {FileRanges} the range of the remote patch
 */
export function patchTextToRanges(validPatches: PatchText): FileRanges {
  const allValidLineRanges: FileRanges = new Map<string, Range[]>();
  validPatches.forEach((patch, filename) => {
    // get each hunk range in the patch string
    const validLineRanges = getGitHubPatchRanges(patch);
    if (!validLineRanges.length) {
      logger.error(
        `Unexpected input patch text provided. Expected "${patch}" to be of format @@ -<number>[,<number>] +<number>[,<number>] @@`
      );
      throw Error('Unexpected patch text format');
    }
    allValidLineRanges.set(filename, validLineRanges);
  });
  return allValidLineRanges;
}

/**
 * Get each pull request remote file's current patch range to identify the scope of each patch
 * @param {Octokit} octokit the authenticated octokit instance
 * @param {RepoDomain} remote the remote repository domain information
 * @param {number} pullNumber the pull request number
 * @param {number} pageSize the number of files to return per pull request list files query
 * @returns {Promise<Object<FileRanges, string[]>>} the scope of each file in the pull request and the list of files whose patch data could not be resolved
 */
export async function getAllValidFileRanges(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number
): Promise<{validFileLines: FileRanges; filesMissingPatch: string[]}> {
  try {
    const {patches, filesMissingPatch} = await getCurrentPulLRequestPatches(
      octokit,
      remote,
      pullNumber,
      pageSize
    );
    const validFileLines = patchTextToRanges(patches);
    return {validFileLines, filesMissingPatch};
  } catch (err) {
    logger.error(
      'Could not convert the remote pull request file patch text to ranges'
    );
    throw err;
  }
}
