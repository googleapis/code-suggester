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

import {Hunk, Range} from '../../../types';

/**
 * Given a value and a list of ranges, find the index of the range domain
 * that the value lies within.
 * Return -1 otherwise.
 * We expect the ranges to be ascending, and disjoint.
 * @param {Range[]} ranges a list of range objects with a start value and end value
 * @param {number} value the value to search for in the range list
 * @param {number} from the lower bound of the search indices. (optional)
 */
export function findRange(ranges: Range[], value: number, from = 0): number {
  function binarySearch(lo: number, hi: number): number {
    const mid = Math.floor((hi + lo) / 2);
    if (lo > hi) {
      return -1;
    } else if (ranges[mid].start > value) {
      return binarySearch(lo, mid - 1);
    } else if (ranges[mid].end < value) {
      return binarySearch(mid + 1, hi);
    } else {
      return mid;
    }
  }
  return binarySearch(from, ranges.length - 1);
}

/**
 * Get a subset of the hunks who exactly fit within a valid hunk scope.
 * Also get the converse of the set of hunks that are invalid.
 * @param {Range[]} scope the list of valid ranges that a hunk can fit between
 * @param {Hunk[]} suggestedHunks the hunks for the file to suggest
 */
function getValidSuggestionHunks(
  scope: Range[],
  suggestedHunks: Hunk[]
): {inScopeHunks: Hunk[]; outOfScopeHunks: Hunk[]} {
  const inScopeHunks: Hunk[] = [];
  const outOfScopeHunks: Hunk[] = [];
  let lastIndex = 0;
  suggestedHunks.forEach(suggestedHunk => {
    const startIndex = findRange(scope, suggestedHunk.oldStart, lastIndex);
    const endIndex = findRange(scope, suggestedHunk.oldEnd, lastIndex);
    lastIndex = endIndex;
    // if the suggested range is not a subset of a single valid range, then skip
    if (startIndex < 0 || endIndex < 0 || endIndex !== startIndex) {
      outOfScopeHunks.push(suggestedHunk);
    } else {
      inScopeHunks.push(suggestedHunk);
    }
  });
  return {inScopeHunks, outOfScopeHunks};
}

/**
 * Return all the files hunks whose scope lies inside a valid scope/ranges, and
 * return files that have a non-empty hunk scope
 * also return invalid hunks
 * @param {Map<string, Range[]>} changeScope a map of each file's valid scope/ranges
 * @param {Map<string, Hunk[]>} suggestions the hunks for each file to suggest
 */
export function getInScopeHunks(
  changeScope: Map<string, Range[]>,
  suggestions: Map<string, Hunk[]>
): {
  inScopeFilesHunks: Map<string, Hunk[]>;
  outOfScopeFilesHunks: Map<string, Hunk[]>;
} {
  const inScopeFilesHunks: Map<string, Hunk[]> = new Map();
  const outOfScopeFilesHunks: Map<string, Hunk[]> = new Map();
  suggestions.forEach((suggestedHunks: Hunk[], fileName: string) => {
    const scope = changeScope.get(fileName);
    if (!scope) {
      outOfScopeFilesHunks.set(fileName, suggestedHunks);
    } else {
      const {inScopeHunks, outOfScopeHunks} = getValidSuggestionHunks(
        scope,
        suggestedHunks
      );
      if (inScopeHunks.length) {
        inScopeFilesHunks.set(fileName, inScopeHunks);
      }
      if (outOfScopeHunks.length) {
        outOfScopeFilesHunks.set(fileName, outOfScopeHunks);
      }
    }
  });
  return {inScopeFilesHunks, outOfScopeFilesHunks};
}

/**
 * Return the suggestions whose filename is not in the list of invalid files to suggest
 * @param {string[]} invalidFiles a list of file names
 * @param {Map<string, Hunk[]>} suggestions the hunks for each file to suggest
 */
export function getInScopeByFileName(
  invalidFiles: string[],
  suggestions: Map<string, Hunk[]>
): Map<string, Hunk[]> {
  // copy original suggestions to our valid suggestions map
  const inScopeFiles: Map<string, Hunk[]> = new Map(suggestions);
  // filter invalid suggestions
  invalidFiles.forEach(file => {
    if (inScopeFiles.has(file)) {
      inScopeFiles.delete(file);
    }
  });
  return inScopeFiles;
}

export function getOutOfScopeByFileName(
  invalidFiles: string[],
  suggestions: Map<string, Hunk[]>
) {
  const invalidFileSuggestions: Map<string, Hunk[]> = new Map();
  invalidFiles.forEach(file => {
    if (suggestions.has(file)) {
      invalidFileSuggestions.set(file, suggestions.get(file) as Hunk[]);
    }
  });
  return invalidFileSuggestions;
}

export function mergeOutOfScopeSuggestions(
  invalidFileNameSuggestions: Map<string, Hunk[]>,
  invalidHunkSuggestions: Map<string, Hunk[]>
): Map<string, Hunk[]> {
  const invalidSuggestions: Map<string, Hunk[]> = new Map(
    invalidHunkSuggestions
  );
  invalidFileNameSuggestions.forEach((hunks: Hunk[], fileName: string) => {
    // invalid file name suggestions should be a superset of invalid hunk suggestions
    invalidSuggestions.set(fileName, hunks);
  });
  return invalidSuggestions;
}
