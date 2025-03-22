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
 */
export function parseAllHunks(diff: string): Map<string, Hunk[]> {
  const hunksByFile: Map<string, Hunk[]> = new Map();
  parseDiff(diff).forEach(file => {
    const filename = file.to ? file.to : file.from!;
    file.chunks.forEach(chunk => {
      // Find the first and last modified lines
      let firstModifiedLine = -1;
      let lastModifiedLine = -1;
      
      // Track normal lines by their line numbers
      const normalLinesByNumber = new Map<number, string>();
      
      // First pass: identify modified range and catalog normal lines
      chunk.changes.forEach(change => {
        if (change.content.includes('No newline at end of file')) {
          return;
        }
        
        if (change.type === 'add' || change.type === 'del') {
          const lineNum = (change as any).ln || 0;
          if (firstModifiedLine === -1 || lineNum < firstModifiedLine) {
            firstModifiedLine = lineNum;
          }
          if (lineNum > lastModifiedLine) {
            lastModifiedLine = lineNum;
          }
        } else if (change.type === 'normal') {
          // Store normal lines by their line number
          const lineNum = (change as any).ln1 || (change as any).ln || 0;
          normalLinesByNumber.set(lineNum, change.content.substring(1));
        }
      });
      
      // If no modifications, skip
      if (firstModifiedLine === -1) return;
      
      // Collect all added lines
      const addedLines: {ln: number, content: string}[] = [];
      chunk.changes.forEach(change => {
        if (change.type === 'add') {
          addedLines.push({
            ln: (change as any).ln || 0,
            content: change.content.substring(1)
          });
        }
      });
      
      // Sort added lines by line number
      addedLines.sort((a, b) => a.ln - b.ln);
      
      // Now build the new content, including both added lines and necessary normal lines
      const newContent: string[] = [];
      let currentLine = firstModifiedLine;
      
      while (currentLine <= lastModifiedLine) {
        // Check if this is an added line
        const addedLine = addedLines.find(line => line.ln === currentLine);
        
        if (addedLine) {
          // Include the added line
          newContent.push(addedLine.content);
        } else {
          // This must be a normal line within the modified range
          // Include it to maintain code structure
          const normalLine = normalLinesByNumber.get(currentLine);
          if (normalLine) {
            newContent.push(normalLine);
          }
        }
        
        currentLine++;
      }
      
      // Create the hunk with the exact modified range
      const hunk: Hunk = {
        oldStart: firstModifiedLine,
        oldEnd: lastModifiedLine,
        newStart: firstModifiedLine,
        newEnd: firstModifiedLine + newContent.length - 1,
        newContent
      };
      
      // Add the hunk
      if (!hunksByFile.has(filename)) {
        hunksByFile.set(filename, []);
      }
      hunksByFile.get(filename)!.push(hunk);
    });
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