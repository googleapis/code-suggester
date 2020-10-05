// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Hunk} from '../../../types';

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

/**
 * Split suggested hunks into commentable and non-commentable hunks. Compares the new line ranges
 * from pullRequestHunks against the old line ranges from allSuggestedHunks.
 * @param pullRequestHunks {Map<string, Hunk[]>} The parsed hunks from that represents the valid lines to comment.
 * @param allSuggestedHunks {Map<string, Hunk[]>} The hunks that represent suggested changes.
 * @returns {PartitionedHunks} split hunks
 */
export function partitionSuggestedHunksByScope(
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
    if (validFileHunks.length > 0) {
      validHunks.set(filename, validFileHunks);
    }
    if (invalidFileHunks.length > 0) {
      invalidHunks.set(filename, invalidFileHunks);
    }
  });
  return {validHunks, invalidHunks};
}
