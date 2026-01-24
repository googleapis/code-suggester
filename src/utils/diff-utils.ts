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
  return parseAllHunks(_DIFF_HEADER + patch).get('file.ext') || [];
}

/**
 * Given a diff expressed in GNU diff format, return the range of lines
 * from the original content that are changed.
 * @param diff Diff expressed in GNU diff format.
 * @returns Map<string, Hunk[]>
 * ToDO: Need to Handle Distant Changes with some proximity threshold number
 */
export function parseAllHunks(diff: string): Map<string, Hunk[]> {
  const hunksByFile: Map<string, Hunk[]> = new Map();
  parseDiff(diff).forEach(file => {
    const filename = file.to ? file.to : file.from!;
    const hunks: Hunk[] = [];
    file.chunks.forEach(chunk => {
      // Track different types of lines
      const allAddedLines: {ln: number; content: string}[] = [];
      const allDeletedLines: {ln: number; content: string}[] = [];
      const allNormalLines: {ln: number; lnNew: number; content: string}[] = [];
      // First pass: collect all changes by type
      chunk.changes.forEach(change => {
        if (change.content.includes('No newline at end of file')) {
          return;
        }
        const content = change.content.substring(1).replace(/[\n\r]+$/g, '');

        if (change.type === 'add') {
          allAddedLines.push({
            ln: (change as any).ln || 0,
            content: content,
          });
        } else if (change.type === 'del') {
          allDeletedLines.push({
            ln: (change as any).ln || 0,
            content: content,
          });
        } else if (change.type === 'normal') {
          allNormalLines.push({
            ln: (change as any).ln1 || 0,
            lnNew: (change as any).ln2 || 0, // New file line number
            content: content,
          });
        }
      });
      // If no modifications, skip
      if (allAddedLines.length === 0 && allDeletedLines.length === 0) return;

      // Sort lines by line number as ParseDiff does not guarantee order
      allAddedLines.sort((a, b) => a.ln - b.ln);
      allDeletedLines.sort((a, b) => a.ln - b.ln);
      allNormalLines.sort((a, b) => a.ln - b.ln);

      // Identify the range to replace
      let startLineToReplace: number;
      let endLineToReplace: number;
      if (allDeletedLines.length > 0) {
        // If there are deletions, start with their range
        const lastDelLine = allDeletedLines[allDeletedLines.length - 1].ln;
        const lastAddedLine =
          allAddedLines.length > 0
            ? Math.max(...allAddedLines.map(a => a.ln))
            : -1;

        // Find neutral lines between additions and deletions
        // Find the full change range
        const allChangeLines = [...allAddedLines, ...allDeletedLines];
        const earliestChangeLine = Math.min(
          ...allChangeLines.map(line => line.ln)
        );

        // Include all normal lines that fall within this range
        const relevantNormalLines = allNormalLines.filter(
          normal =>
            normal.ln >= earliestChangeLine &&
            (normal.ln < lastDelLine || normal.lnNew < lastAddedLine)
        );
        // Calculate the full replacement range including relevant normal lines
        const allRelevantLines = [...allDeletedLines, ...relevantNormalLines];
        startLineToReplace = Math.min(...allRelevantLines.map(line => line.ln));
        endLineToReplace = Math.max(...allRelevantLines.map(line => line.ln));
      } else {
        // Pure additions (no deletions)
        // Use the first added line as the insertion point
        startLineToReplace = allAddedLines[0].ln;
        endLineToReplace = startLineToReplace;
      }
      // Now build the new content
      const newContent: string[] = [];

      // Normal processing: include additions and normal lines in the right order
      const linesToInclude: {ln: number; content: string}[] = [];

      // Add all the additions to our map
      allAddedLines.forEach(line => {
        linesToInclude.push({ln: line.ln, content: line.content});
      });
      // Add relevant normal lines that should be preserved
      allNormalLines.forEach(line => {
        // Only include normal lines within our replacement range if they haven't been replaced by additions
        if (line.ln >= startLineToReplace && line.ln <= endLineToReplace) {
          linesToInclude.push({ln: line.lnNew, content: line.content});
        }
      });

      // Order the lines and build the final content
      linesToInclude
        .sort((a, b) => a.ln - b.ln)
        .forEach(line => {
          newContent.push(line.content);
        });

      // Create the hunk with the replacement range
      const hunk: Hunk = {
        oldStart: startLineToReplace,
        oldEnd: endLineToReplace,
        newStart: startLineToReplace,
        newEnd: startLineToReplace + newContent.length - 1,
        newContent,
      };

      hunks.push(hunk);
    });

    if (hunks.length > 0) {
      hunksByFile.set(filename, hunks);
    }
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
  return parseAllHunks(diff).get('unused') || [];
}
