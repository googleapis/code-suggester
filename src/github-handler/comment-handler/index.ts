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

import {FileDiffContent, RepoDomain} from '../../types';
import {Octokit} from '@octokit/rest';
import {makeInlineSuggestions} from './make-review-handler';
import {logger} from '../../logger';
import {getRawSuggestionHunks} from './raw-patch-handler/raw-hunk-handler';
import {getPullRequestHunks} from './get-hunk-scope-handler/remote-patch-ranges-handler';
import {partitionSuggestedHunksByScope} from './get-hunk-scope-handler/scope-handler';
import { parseAllHunks } from '../diff-utils';

/**
 * Comment on a Pull Request
 * @param {Octokit} octokit authenticated octokit isntance
 * @param {RepoDomain} remote the Pull Request repository
 * @param {number} pullNumber the Pull Request number
 * @param {number} pageSize the number of files to comment on // TODO pagination
 * @param {Map<string, FileDiffContent>} diffContents the old and new contents of the files to suggest
 * @returns the created review's id, or null if no review was made
 */
export async function reviewPullRequest(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number,
  diffContents: Map<string, FileDiffContent> | string
): Promise<number | null> {
  try {
    // get the hunks from the pull request
    const pullRequestHunks = await getPullRequestHunks(
      octokit,
      remote,
      pullNumber,
      pageSize
    );

    // get the hunks from the suggested change
    const allSuggestedHunks = (typeof(diffContents) === "string")
      ? parseAllHunks(diffContents)
      : getRawSuggestionHunks(diffContents);

    // split hunks by commentable and uncommentable
    const {validHunks, invalidHunks} = partitionSuggestedHunksByScope(
      pullRequestHunks,
      allSuggestedHunks
    );

    // create pull request review
    const reviewNumber = await makeInlineSuggestions(
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
