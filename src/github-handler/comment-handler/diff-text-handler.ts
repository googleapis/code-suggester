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

import {Range} from '../../types';

const INDEX_ORIGINAL = 1;
const INDEX_UPDATED = 2;

/**
 * Example output of one output of one regex exec
 *
 * '@@ -0,0 +1,12 @@\n', // original text
 * '0,0', // original hunk
 * 1,12', // new hunk
 * index: 0,
 * input: '@@ -0,0 +1,12 @@\n+Hello world%0A',
 * groups: undefined
 *
 */
const REGEX_MANY_MANY = /@@ -([0-9]+,[0-9]+) \+([0-9]+,[0-9]+) @@\n/g;
const REGEX_ONE_MANY = /@@ -([0-9]+) \+([0-9]+,[0-9]+) @@\n/g;
const REGEX_ONE_ONE = /@@ -([0-9]+) \+([0-9]+) @@\n/g;
const REGEX_MANY_ONE = /@@ -([0-9]+) \+([0-9]+,[0-9]+) @@\n/g;

/**
 * Parses the diff-match-patch library char-based patch text
 * @param {string} patchText
 * @param {boolean} originalText if set to true returns the original hunk range. If set to false, returns the updated hunk range
 * @returns patch ranges
 */
export function getDiffPatchMatchPatchRange(
  patchText: string,
  originalText: boolean
): Range[] {
  const index = originalText ? INDEX_ORIGINAL : INDEX_UPDATED;
  const ranges: Range[] = [];
  for (
    let patch = REGEX_MANY_MANY.exec(patchText), i = 0;
    patch !== null;
    patch = REGEX_MANY_MANY.exec(patchText), i++
  ) {
    const patchData = patch[index].split(',');
    // the char position of the hunk
    const start = parseInt(patchData[0]); // start of change
    const offset = parseInt(patchData[1]); // diff-match-patch returns the offset from start char
    const range = new Range(start, start + offset);
    ranges.push(range);
  }
  return ranges;
}

/**
 * Parses the GitHub line-based patch text
 * @param {string} patchText
 * @returns patch ranges
 */
export function getGitHubPatchRanges(patchText: string): Range[] {
  const ranges: Range[] = [];
  for (
    let patch = REGEX_MANY_MANY.exec(patchText);
    patch !== null;
    patch = REGEX_MANY_MANY.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    const patchData = patch[INDEX_UPDATED].split(',');
    // the line number ranges of the updated text
    const start = parseInt(patchData[0]);
    const offset = parseInt(patchData[1]);
    const range = new Range(start, start + offset);
    ranges.push(range);
  }
  for (
    let patch = REGEX_ONE_MANY.exec(patchText);
    patch !== null;
    patch = REGEX_ONE_MANY.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    const patchData = patch[INDEX_UPDATED].split(',');
    // the line number ranges of the updated text
    const start = parseInt(patchData[0]);
    const offset = parseInt(patchData[1]);
    const range = new Range(start, start + offset);
    ranges.push(range);
  }
  for (
    let patch = REGEX_ONE_ONE.exec(patchText);
    patch !== null;
    patch = REGEX_ONE_ONE.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    // the line number ranges of the updated text
    const start = parseInt(patch[INDEX_UPDATED]);
    const range = new Range(start, start + 1);
    ranges.push(range);
  }
  for (
    let patch = REGEX_MANY_ONE.exec(patchText);
    patch !== null;
    patch = REGEX_MANY_ONE.exec(patchText)
  ) {
    // stricly interested in the updated/current github file content
    // the line number ranges of the updated text
    const start = parseInt(patch[INDEX_UPDATED]);
    const range = new Range(start, start + 1);
    ranges.push(range);
  }
  return ranges;
}
