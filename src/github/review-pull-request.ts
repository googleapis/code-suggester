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

import {FileDiffContent, RepoDomain, Hunk} from '../types';
import {Octokit} from '@octokit/rest';
import {logger} from '../logger';
import {parseAllHunks, parsePatch} from '../utils/diff-utils';
import {
  getRawSuggestionHunks,
  partitionSuggestedHunksByScope,
} from '../utils/hunk-utils';

function hunkErrorMessage(hunk: Hunk): string {
  return `  * lines ${hunk.oldStart}-${hunk.oldEnd}`;
}

function fileErrorMessage(filename: string, hunks: Hunk[]): string {
  return `* ${filename}\n` + hunks.map(hunkErrorMessage).join('\n');
}

/**
 * Build an error message based on invalid hunks.
 * Returns an empty string if the provided hunks are empty.
 * @param invalidHunks a map of filename to hunks that are not suggestable
 */
export function buildSummaryComment(invalidHunks: Map<string, Hunk[]>): string {
  if (invalidHunks.size === 0) {
    return '';
  }
  return (
    'Some suggestions could not be made:\n' +
    Array.from(invalidHunks, ([filename, hunks]) =>
      fileErrorMessage(filename, hunks)
    ).join('\n')
  );
}

const COMFORT_PREVIEW_HEADER =
  'application/vnd.github.comfort-fade-preview+json';

/**
 * Multiline comment GitHub API parameters
 * For more information see
 * https://developer.github.com/v3/pulls/comments/#create-a-review-comment-for-a-pull-request
 */
interface MultilineComment {
  body: string;
  path: string;
  start_line: number;
  line: number;
  side: 'RIGHT' | 'LEFT';
  start_side: 'RIGHT' | 'LEFT';
}

interface SingleLineComment {
  body: string;
  path: string;
  line: number;
  side: 'RIGHT' | 'LEFT';
}

type Comment = SingleLineComment | MultilineComment;

/**
 * GitHub-defined type. The Octokit library/docs are probably behind since create review already
 * accept multi-line code comments. However, the API does not reflect that.
 */
export type PullsCreateReviewParamsComments = {
  path: string;
  position: number;
  body: string;
};

/**
 * Convert the patch suggestions into GitHub parameter objects.
 * Use this to generate review comments
 * For information see:
 * https://developer.github.com/v3/pulls/comments/#create-a-review-comment-for-a-pull-request
 * @param suggestions
 */
export function buildReviewComments(
  suggestions: Map<string, Hunk[]>
): Comment[] {
  const fileComments: Comment[] = [];
  suggestions.forEach((hunks: Hunk[], fileName: string) => {
    hunks.forEach(hunk => {
      const newContent = hunk.newContent.join('\n');
      if (hunk.oldStart === hunk.oldEnd) {
        const singleComment: SingleLineComment = {
          path: fileName,
          body: `\`\`\`suggestion\n${newContent}\n\`\`\``,
          line: hunk.oldEnd,
          side: 'RIGHT',
        };
        fileComments.push(singleComment);
      } else {
        const comment: MultilineComment = {
          path: fileName,
          body: `\`\`\`suggestion\n${newContent}\n\`\`\``,
          start_line: hunk.oldStart,
          line: hunk.oldEnd,
          side: 'RIGHT',
          start_side: 'RIGHT',
        };
        fileComments.push(comment);
      }
    });
  });
  return fileComments;
}

/**
 * Make a request to GitHub to make review comments
 * @param octokit an authenticated octokit instance
 * @param suggestions code suggestions patches
 * @param remote the repository domain
 * @param pullNumber the pull request number to make a review on
 */
export async function makeInlineSuggestions(
  octokit: Octokit,
  suggestions: Map<string, Hunk[]>,
  outOfScopeSuggestions: Map<string, Hunk[]>,
  remote: RepoDomain,
  pullNumber: number
): Promise<number | null> {
  const comments = buildReviewComments(suggestions);
  if (!comments.length) {
    logger.info('No valid suggestions to make');
  }
  if (!comments.length && !outOfScopeSuggestions.size) {
    logger.info('No suggestions were generated. Exiting...');
    return null;
  }
  const summaryComment = buildSummaryComment(outOfScopeSuggestions);
  if (summaryComment) {
    logger.warn('Some suggestions could not be made');
  }
  // apply the suggestions to the latest sha
  // the latest Pull Request hunk range includes
  // all previous commit valid hunk ranges
  const headSha = (
    await octokit.pulls.get({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
    })
  ).data.head.sha;
  const reviewNumber = (
    await octokit.pulls.createReview({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      commit_id: headSha,
      event: 'COMMENT',
      body: summaryComment,
      headers: {accept: COMFORT_PREVIEW_HEADER},
      // Octokit type definitions doesn't support mulitiline comments, but the GitHub API does
      comments: comments as unknown as PullsCreateReviewParamsComments[],
    })
  ).data.id;
  logger.info(`Successfully created a review on pull request: ${pullNumber}.`);
  return reviewNumber;
}

/**
 * Comment on a Pull Request
 * @param {Octokit} octokit authenticated octokit isntance
 * @param {RepoDomain} remote the Pull Request repository
 * @param {number} pullNumber the Pull Request number
 * @param {number} pageSize the number of files to comment on // TODO pagination
 * @param {Map<string, FileDiffContent>} diffContents the old and new contents of the files to suggest
 * @returns the created review's id, or null if no review was made
 */
export async function createPullRequestReview(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number,
  diffContents: Map<string, FileDiffContent> | string
): Promise<number | null> {
  try {
    // get the hunks from the pull request
    const pullRequestHunks = await exports.getPullRequestHunks(
      octokit,
      remote,
      pullNumber,
      pageSize
    );

    // get the hunks from the suggested change
    const allSuggestedHunks =
      typeof diffContents === 'string'
        ? parseAllHunks(diffContents)
        : getRawSuggestionHunks(diffContents);

    // split hunks by commentable and uncommentable
    const {validHunks, invalidHunks} = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );

    // create pull request review
    const reviewNumber = await exports.makeInlineSuggestions(
      octokit,
      validHunks,
      invalidHunks,
      remote,
      pullNumber
    );
    return reviewNumber;
  } catch (err) {
    logger.error('Failed to suggest');
    throw err;
  }
}

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
