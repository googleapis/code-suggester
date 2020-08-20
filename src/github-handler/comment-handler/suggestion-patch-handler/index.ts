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
  getInScopeHunks,
  getInScopeByFileName,
  getOutOfScopeByFileName,
  mergeOutOfScopeSuggestions,
} from './scope-suggestion-hunks-handler';
import {RawContent, Hunk, Range, Patch} from '../../../types';

/**
 * Get the in scope (of the corresponding pull request's) hunks and files
 * @param {Map<string, RawContent>} rawChanges the raw old content and new content of a file
 * @param {string[]} invalidFiles list of invalid files
 * @param {Map<string, Range[]>} validFileLines a map of each file's in scope lines for a Pull Request
 */
export function getValidSuggestionHunks(
  rawChanges: Map<string, RawContent>,
  invalidFiles: string[],
  validFileLines: Map<string, Range[]>
): {
  inScopeSuggestions: Map<string, Hunk[]>;
  outOfScopeSuggestions: Map<string, Hunk[]>;
} {
  const totalfileHunks = getRawSuggestionHunks(rawChanges);
  const outofScopeByFilename = getOutOfScopeByFileName(
    invalidFiles,
    totalfileHunks
  );
  const inScopeByFileName = getInScopeByFileName(invalidFiles, totalfileHunks);

  const scopifiedHunks = getInScopeHunks(
    validFileLines,
    inScopeByFileName
  );
  const outOfScopeSuggestions = mergeOutOfScopeSuggestions(
    outofScopeByFilename,
    scopifiedHunks.outOfScopeFilesHunks
  );
  return {
    inScopeSuggestions: scopifiedHunks.inScopeFilesHunks,
    outOfScopeSuggestions
  };
}

/**
 * Get the range of the old version of every file and the corresponding new text for that range
 * whose old and new contents differ, under the constraints that the file
 * is in scope for Pull Request, as well as its lines.
 * @param {Map<string, RawContent>} rawChanges the raw old content and new content of a file
 * @param {string[]} invalidFiles list of invalid files
 * @param {Map<string, Range[]>} validFileLines a map of each file's in scope lines for a Pull Request
 */
export function getSuggestionPatches(
  rawChanges: Map<string, RawContent>,
  invalidFiles: string[],
  validFileLines: Map<string, Range[]>
): Map<string, Patch> {
  const filePatches: Map<string, Patch> = new Map();
  getValidSuggestionHunks(rawChanges, invalidFiles, validFileLines);
  // TODO get patches from getValidSuggestionHunks output
  return filePatches;
}
