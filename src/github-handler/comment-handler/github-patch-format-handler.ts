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

import {PatchSyntaxError, Range} from '../../types';
import {logger} from '../../logger';

const REGEX_INDEX_OF_UPDATED_HUNK = 2;

/**
 * @@ -<start line original>,<offset> +<start line updated>,<offset> @@
 * i.e. @@ -132,7 +132,7 @@
 */
const REGEX_MULTILINE_RANGE = /@@ -([0-9]+,[0-9]+) \+([0-9]+,[0-9]+) @@/g;

/**
 * @@ -<start line original> +<start line updated>,<offset> @@
 * i.e. a deletion @@ -1 +0,0 @@
 */
const REGEX_ONELINE_TO_MULTILINE_RANGE = /@@ -([0-9]+) \+([0-9]+,[0-9]+) @@/g;
/**
 * @@ -<line original> +<line updated> @@
 * i.e. @@ -1 +1 @@
 */
const REGEX_ONELINE_RANGE = /@@ -([0-9]+) \+([0-9]+) @@/g;
/**
 * @@ -<start line original>,<offset> +<line updated> @@
 * i.e. file creation @@ -0,0 +1 @@
 */
const REGEX_MULTILINE_TO_ONELINE_RANGE = /@@ -([0-9]+,[0-9]+) \+([0-9]+) @@/g;

/**
 * Parses the GitHub line-based patch text.
 * Throws an error if the patch text is undefined, null, or not a patch text.
 * Example output of one output of one regex exec:
 *
 * '@@ -0,0 +1,12 @@\n', // original text
 * '0,0', // original hunk
 * '1,12', // new hunk
 * index: 0,
 * input: '@@ -0,0 +1,12 @@\n+Hello world%0A',
 * groups: undefined
 * @param {string} patchText
 * @returns patch ranges
 */
export function getGitHubPatchRanges(patchText: string): Range[] {
  if (typeof patchText !== 'string') {
    throw new TypeError('GitHub patch text must be a string');
  }
  const ranges: Range[] = [];
  // CASE I: multiline patch ranges
  // includes non-first single-line patches
  // i.e. @@ -3,4 +3,4 @@
  // which only edits line 3, but is still a multiline patch range
  for (
    let patch = REGEX_MULTILINE_RANGE.exec(patchText);
    patch !== null;
    patch = REGEX_MULTILINE_RANGE.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    const patchData = patch[REGEX_INDEX_OF_UPDATED_HUNK].split(',');
    // the line number ranges of the updated text
    const start = parseInt(patchData[0]);
    const offset = parseInt(patchData[1]);
    const range: Range = {start, end: start + offset};
    ranges.push(range);
  }
  // CASE II: oneline text becomes multiline text
  for (
    let patch = REGEX_ONELINE_TO_MULTILINE_RANGE.exec(patchText);
    patch !== null;
    patch = REGEX_ONELINE_TO_MULTILINE_RANGE.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    const patchData = patch[REGEX_INDEX_OF_UPDATED_HUNK].split(',');
    // the line number ranges of the updated text
    const start = parseInt(patchData[0]);
    const offset = parseInt(patchData[1]);
    const range: Range = {start, end: start + offset};
    ranges.push(range);
  }
  // CASE III: first line of text updated
  for (
    let patch = REGEX_ONELINE_RANGE.exec(patchText);
    patch !== null;
    patch = REGEX_ONELINE_RANGE.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    // the line number ranges of the updated text
    const start = parseInt(patch[REGEX_INDEX_OF_UPDATED_HUNK]);
    const range: Range = {start, end: start + 1};
    ranges.push(range);
  }
  // CASE IV: Multiline range is reduced to one line
  // 0,0 constitutes a multi-line range
  for (
    let patch = REGEX_MULTILINE_TO_ONELINE_RANGE.exec(patchText);
    patch !== null;
    patch = REGEX_MULTILINE_TO_ONELINE_RANGE.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    // the line number ranges of the updated text
    const start = parseInt(patch[REGEX_INDEX_OF_UPDATED_HUNK]);
    const range: Range = {start, end: start + 1};
    ranges.push(range);
  }
  if (!ranges.length) {
    logger.error(
      `Unexpected input patch text provided. Expected "${patchText}" to be of format @@ -<number>[,<number>] +<number>[,<number>] @@`
    );
    throw new PatchSyntaxError('Unexpected patch text format');
  }
  return ranges;
}
