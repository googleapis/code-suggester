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

import {getRawSuggestionHunks} from './suggestion-hunk-handler';
import {
  filterOutOfScopeHunks,
  filterOutOfScopeFiles,
} from './fix-suggestion-hunks-handler';
import {RawChanges, FileHunks, FileRanges, FilePatches} from '../../../types';

/**
 * Get the valid hunks and files
 * @param {RawChanges} rawChanges the raw old content and new content of a file
 * @param {string[]} invalidFiles list of invalid files
 * @param {FileRanges} validFileLines a map of each file's valid lines for a Pull Request
 */
export function getValidSuggestionHunks(
  rawChanges: RawChanges,
  invalidFiles: string[],
  validFileLines: FileRanges
): FileHunks {
  const fileHunks = getRawSuggestionHunks(rawChanges);
  filterOutOfScopeFiles(invalidFiles, fileHunks);
  filterOutOfScopeHunks(validFileLines, fileHunks);
  return fileHunks;
}

/**
 * Get the range of the old version of every file and the corresponding new text for that range
 * whose old and new contents differ, under the constraints that the file
 * is in scope for Pull Request, as well as its lines.
 * @param {RawChanges} rawChanges the raw old content and new content of a file
 * @param {string[]} invalidFiles list of invalid files
 * @param {FileRanges} validFileLines a map of each file's valid lines for a Pull Request
 */
export function getSuggestionPatches(
  rawChanges: RawChanges,
  invalidFiles: string[],
  validFileLines: FileRanges
): FilePatches {
  const filePatches: FilePatches = new Map();
  getValidSuggestionHunks(rawChanges, invalidFiles, validFileLines);
  // TODO get patches from getValidSuggestionHunks output
  return filePatches;
}
