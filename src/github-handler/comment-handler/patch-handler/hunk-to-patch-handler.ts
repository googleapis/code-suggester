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

import {Hunk, Patch, RawContent} from '../../../types';

/**
 * From the each file's hunk, generate each file's hunk's old version range
 * and the new content (from the user's) to update that range with.
 * @param filesHunks a list of hunks for each file where the lines are at least 1
 * @param rawChanges
 * @returns patches to upload to octokit
 */
export function generatePatches(
  filesHunks: Map<string, Hunk[]>,
  rawChanges: Map<string, RawContent>
): Map<string, Patch[]> {
  const filesPatches: Map<string, Patch[]> = new Map();
  filesHunks.forEach((hunks, fileName) => {
    const patches: Patch[] = [];
    // we expect all hunk lists to not be empty
    hunks.forEach(hunk => {
      // returns a copy of the hashmap value, then creates a new list with new substrings
      const lines = rawChanges.get(fileName)!.newContent.split('\n');
      // creates a new shallow-copied subarray
      // we assume the hunk new start and new end to be within the domain of the lines length
      if (
        hunk.newStart < 1 ||
        hunk.newEnd < 1 ||
        hunk.oldStart < 1 ||
        hunk.oldEnd < 1
      ) {
        throw new RangeError('The file line value should be at least 1');
      }
      const newContent = lines.slice(hunk.newStart - 1, hunk.newEnd - 1);
      const patch: Patch = {
        newContent: newContent.join('\n'),
        start: hunk.oldStart,
        end: hunk.oldEnd,
      };
      patches.push(patch);
    });
    filesPatches.set(fileName, patches);
  });
  return filesPatches;
}
