// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Hunk, FileDiffContent} from '../types';
import {getSuggestedHunks} from './diff-utils';
import {logger} from '../logger';

/**
 * Shift a Hunk up one line so it starts one line earlier.
 * @param {Hunk} hunk
 * @returns {Hunk | null} the adjusted Hunk or null if there is no preceeding line.
 */
export function adjustHunkUp(hunk: Hunk): Hunk | null {
  if (!hunk.previousLine) {
    return null;
  }
  return {
    oldStart: hunk.oldStart - 1,
    oldEnd: hunk.oldEnd,
    newStart: hunk.newStart - 1,
    newEnd: hunk.newEnd,
    newContent: [hunk.previousLine, ...hunk.newContent],
  };
}

/**
 * Shift a Hunk up one line so it ends one line later.
 * @param {Hunk} hunk
 * @returns {Hunk | null} the adjusted Hunk or null if there is no following line.
 */
export function adjustHunkDown(hunk: Hunk): Hunk | null {
  if (!hunk.nextLine) {
    return null;
  }
  return {
    oldStart: hunk.oldStart,
    oldEnd: hunk.oldEnd + 1,
    newStart: hunk.newStart,
    newEnd: hunk.newEnd + 1,
    newContent: hunk.newContent.concat(hunk.nextLine),
  };
}

/**
 * Given a map where the key is the file name and the value is the
 * old content and new content of the file
 * compute the hunk for each file whose old and new contents differ.
 * Do not compute the hunk if the old content is the same as the new content.
 * The hunk list is sorted and each interval is disjoint.
 * @param {Map<string, FileDiffContent>} diffContents a map of the original file contents and the new file contents
 * @returns the hunks for each file whose old and new contents differ
 */
export function getRawSuggestionHunks(
  diffContents: Map<string, FileDiffContent>
): Map<string, Hunk[]> {
  const fileHunks: Map<string, Hunk[]> = new Map();
  diffContents.forEach((fileDiffContent: FileDiffContent, fileName: string) => {
    // if identical don't calculate the hunk and continue in the loop
    if (fileDiffContent.oldContent === fileDiffContent.newContent) {
      return;
    }
    const hunks = getSuggestedHunks(
      fileDiffContent.oldContent,
      fileDiffContent.newContent
    );
    fileHunks.set(fileName, hunks);
  });
  logger.info('Parsed ranges of old and new patch');
  return fileHunks;
}
interface PartitionedHunks {
  validHunks: Map<string, Hunk[]>;
  invalidHunks: Map<string, Hunk[]>;
}

interface PartitionedFileHunks {
  validFileHunks: Hunk[];
  invalidFileHunks: Hunk[];
}

function hunkOverlaps(validHunk: Hunk, suggestedHunk: Hunk): boolean {
  return (
    suggestedHunk.oldStart >= validHunk.newStart &&
    suggestedHunk.oldEnd <= validHunk.newEnd
  );
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
      invalidFileHunks.push(suggestedHunk);
      return;
    }
    // if deletion only or addition only
    if (
      suggestedHunk.newEnd < suggestedHunk.newStart ||
      suggestedHunk.oldEnd < suggestedHunk.oldStart
    ) {
      // try using previous line
      let adjustedHunk = adjustHunkUp(suggestedHunk);
      if (adjustedHunk && hunkOverlaps(candidateHunk, adjustedHunk)) {
        validFileHunks.push(adjustedHunk);
        return;
      }

      // try using next line
      adjustedHunk = adjustHunkDown(suggestedHunk);
      if (adjustedHunk && hunkOverlaps(candidateHunk, adjustedHunk)) {
        validFileHunks.push(adjustedHunk);
        return;
      }
    } else if (hunkOverlaps(candidateHunk, suggestedHunk)) {
      validFileHunks.push(suggestedHunk);
      return;
    }

    invalidFileHunks.push(suggestedHunk);
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
