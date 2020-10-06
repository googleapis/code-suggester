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

// This header is ignored for calculating patch ranges, but is neccessary
// for parsing a diff
const _DIFF_HEADER = `diff --git a/file.ext b/file.ext
index cac8fbc..87f387c 100644
--- a/file.ext
+++ b/file.ext
`;

/**
 * Given a patch expressed in GNU diff format, return the range of lines
 * from the original content that are changed.
 * @param diff Diff expressed in GNU diff format.
 * @returns Hunk[]
 */
export function parsePatch(patch: string): Hunk[] {
  return parseAllHunks(_DIFF_HEADER + patch).get("file.ext") || new Array();
}

/**
 * Given a diff expressed in GNU diff format, return the range of lines
 * from the original content that are changed.
 * @param diff Diff expressed in GNU diff format.
 * @returns Map<string, Hunk[]>
 */
export function parseAllHunks(diff: string): Map<string, Hunk[]> {
  const hunksByFile: Map<string, Hunk[]> = new Map();
  parseDiff(diff).forEach((file) => {
    const filename = file.to ? file.to : file.from!;
    const chunks = file.chunks.map(chunk => {
      let oldStart = chunk.oldStart;
      let newStart = chunk.newStart;
      let normalLines = 0;
      let changeSeen = false;
      const newLines: string[] = [];
  
      chunk.changes.forEach(change => {
        if (change.type === 'normal') {
          normalLines++;
        } else {
          if (change.type === 'add') {
            // strip off leading '+' and trailing carriage return
            newLines.push(change.content.substring(1).replace(/[\n\r]+$/g, ''));
          }
          if (!changeSeen) {
            oldStart += normalLines;
            newStart += normalLines;
            changeSeen = true;
          }
        }
      });
      const newEnd = newStart + chunk.newLines - normalLines - 1;
      const oldEnd = oldStart + chunk.oldLines - normalLines - 1;
      return {
        oldStart: oldStart,
        oldEnd: oldEnd,
        newStart: newStart,
        newEnd: newEnd,
        newContent: newLines,
      };
    });
    hunksByFile.set(filename, chunks);
  });
  return hunksByFile;
}

/**
 * Given two texts, return the range of lines that are changed.
 * @param oldContent The original content.
 * @param newContent The new content.
 * @returns Hunk[]
 */
export function getSuggestedHunks(
  oldContent: string,
  newContent: string
): Hunk[] {
  const diff = createPatch('unused', oldContent, newContent);
  return parseAllHunks(diff).get('unused') || new Array();
}
