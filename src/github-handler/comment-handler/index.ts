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

import {FileDiffContent, RepoDomain, Hunk} from '../../types';
import {Octokit} from '@octokit/rest';
import {makeInlineSuggestions} from './make-review-handler';
import {logger} from '../../logger';
import {getRawSuggestionHunks} from './raw-patch-handler/raw-hunk-handler';
import {getPullRequestHunks} from './get-hunk-scope-handler/remote-patch-ranges-handler';

interface PartitionedHunks {
  validHunks: Map<string, Hunk[]>;
  invalidHunks: Map<string, Hunk[]>;
}

interface PartitionedFileHunks {
  validFileHunks: Hunk[];
  invalidFileHunks: Hunk[];
}

function partitionFileHunks(
  pullRequestHunks: Hunk[],
  suggestedHunks: Hunk[]
): PartitionedFileHunks {
  // check ranges: the entirety of the old range of the suggested
  // hunk must fit inside the new range of the valid Hunks
  let i = 0;
  let candidateHunk = pullRequestHunks[i];
  const validFileHunks: Hunk[] = [];
  const invalidFileHunks: Hunk[] = [];
  suggestedHunks.forEach(suggestedHunk => {
    while (candidateHunk && suggestedHunk.oldStart > candidateHunk.newEnd) {
      i++;
      candidateHunk = pullRequestHunks[i];
    }
    if (!candidateHunk) {
      return;
    }
    if (
      suggestedHunk.oldStart >= candidateHunk.newStart &&
      suggestedHunk.oldEnd <= candidateHunk.newEnd
    ) {
      validFileHunks.push(suggestedHunk);
    } else {
      invalidFileHunks.push(suggestedHunk);
    }
  });
  return {validFileHunks, invalidFileHunks};
}

function partitionSuggestedHunksByScope(
  pullRequestHunks: Map<string, Hunk[]>,
  allSuggestedHunks: Map<string, Hunk[]>
): PartitionedHunks {
  const validHunks: Map<string, Hunk[]> = new Map();
  const invalidHunks: Map<string, Hunk[]> = new Map();
  allSuggestedHunks.forEach((suggestedHunks, filename) => {
    const pullRequestFileHunks = pullRequestHunks.get(filename);
    if (!pullRequestFileHunks) {
      // file is not the original PR
      invalidHunks.set(filename, suggestedHunks);
      return;
    }

    const {validFileHunks, invalidFileHunks} = partitionFileHunks(
      pullRequestFileHunks,
      suggestedHunks
    );
    validHunks.set(filename, validFileHunks);
    if (invalidFileHunks.length > 0) {
      invalidHunks.set(filename, invalidFileHunks);
    }
  });

  return {validHunks, invalidHunks};
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
export async function reviewPullRequest(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number,
  diffContents: Map<string, FileDiffContent>
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
    const allSuggestedHunks = getRawSuggestionHunks(diffContents);

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
