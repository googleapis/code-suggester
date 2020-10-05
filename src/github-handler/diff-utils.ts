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

import {Hunk} from '../types';
import * as parseDiff from 'parse-diff';
import {createPatch} from 'diff';

/**
 * Given a diff expressed in GNU diff format, return the range of lines
 * from the original content that are changed.
 * @param diff Diff expressed in GNU diff format.
 * @returns Hunk[]
 */
export function parseHunks(diff: string): Hunk[] {
  const chunks = parseDiff(diff)[0].chunks;
  return chunks.map((chunk) => {
    let start = chunk.newStart + chunk.newLines;
    let oldEnd = 0;
    chunk.changes.forEach((change) =>  {
      if (change.type == "add") {
        start = Math.min(start, change.ln);
      }
      if (change.type == "del") {
        start = Math.min(start, change.ln);
        oldEnd = Math.max(oldEnd, change.ln);
      }
    });
    const newEnd = oldEnd + chunk.newLines - chunk.oldLines;
    return {oldStart: start, oldEnd: oldEnd, newStart: start, newEnd: newEnd};
  });
}

/**
 * Given two texts, return the range of lines that are changed.
 * @param oldContent The original content.
 * @param newContent The new content.
 * @returns Hunk[]
 */
export function getSuggestedHunks(oldContent: string, newContent: string): Hunk[] {
  const diff = createPatch('unused', oldContent, newContent);
  return parseHunks(diff);
}
