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

import {Hunk, FileRanges, Range, FileHunks} from '../../../types';

/**
 * Given a value and a list of ranges, find the index of the range domain
 * that the value lies within.
 * Return -1 otherwise.
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
 * @param {Range[]} scope the list of valid ranges that a hunk can fit between
 * @param {Hunk[]} suggestedHunks the hunks for the file to suggest
 */
function getValidSuggestionHunks(scope: Range[], suggestedHunks: Hunk[]) {
  const validSuggestionHunks: Hunk[] = [];
  let lastIndex = 0;
  suggestedHunks.forEach(suggestedHunk => {
    const validStartIndex = findRange(scope, suggestedHunk.oldStart, lastIndex);
    const validEndIndex = findRange(scope, suggestedHunk.oldEnd, lastIndex);
    lastIndex = validEndIndex;
    // if the suggested range is not a subset of a single valid range, then skip
    if (
      validStartIndex < 0 ||
      validEndIndex < 0 ||
      validEndIndex !== validStartIndex
    ) {
      return;
    }
    validSuggestionHunks.push(suggestedHunk);
  });
  return validSuggestionHunks;
}

/**
 * Remove all the hunks whose scope lies outside a valid scope/ranges.
 * Remove the files that have no valid scope
 * Remove the files that have no valid hunks
 * @param {FileRanges} validRanges a map of each file's valid scope/ranges
 * @param {FileHunks} suggestions the hunks for each file to suggest
 */
export function filterOutOfScopeHunks(
  changeScope: FileRanges,
  suggestions: FileHunks
) {
  suggestions.forEach((suggestedHunks: Hunk[], fileName: string) => {
    const scope = changeScope.get(fileName);
    if (!scope) {
      suggestions.delete(fileName);
    } else {
      const validSuggestionHunks = getValidSuggestionHunks(
        scope,
        suggestedHunks
      );
      if (validSuggestionHunks.length) {
        suggestions.set(fileName, validSuggestionHunks);
      } else {
        suggestions.delete(fileName);
      }
    }
  });
}

/**
 * Remove the suggestions whose filename is in the list of invalid files to suggest
 * @param {string[]} invalidFiles a list of file names
 * @param {FileHunks} suggestions the hunks for each file to suggest
 */
export function filterOutOfScopeFiles(
  invalidFiles: string[],
  suggestions: FileHunks
) {
  invalidFiles.forEach(file => {
    if (suggestions.get(file) !== undefined) {
      suggestions.delete(file);
    }
  });
}
