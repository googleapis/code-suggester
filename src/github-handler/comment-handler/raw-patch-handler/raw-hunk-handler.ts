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

import {Hunk, FileDiffContent} from '../../../types';
import {logger} from '../../../logger';
import {getSuggestedHunks} from '../../diff-utils';

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
    const hunks = getSuggestedHunks(fileDiffContent.oldContent, fileDiffContent.newContent);
    fileHunks.set(fileName, hunks);
  });
  logger.info('Parsed ranges of old and new patch');
  return fileHunks;
}
