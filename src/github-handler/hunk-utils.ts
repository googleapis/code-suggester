// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Hunk} from '../types';

/**
 * Shift a Hunk up one line so it starts one line earlier.
 * @param {Hunk} hunk
 * @returns {Hunk | null} the adjusted Hunk or null if there is no preceeding line.
 */
export function adjustHunkUp(hunk: Hunk): Hunk | null {
  if (!hunk.previousLine) {
    return null;
  }
  return {
    oldStart: hunk.oldStart - 1,
    oldEnd: hunk.oldEnd,
    newStart: hunk.newStart - 1,
    newEnd: hunk.newEnd,
    newContent: [hunk.previousLine, ...hunk.newContent],
  };
}

/**
 * Shift a Hunk up one line so it ends one line later.
 * @param {Hunk} hunk
 * @returns {Hunk | null} the adjusted Hunk or null if there is no following line.
 */
export function adjustHunkDown(hunk: Hunk): Hunk | null {
  if (!hunk.nextLine) {
    return null;
  }
  return {
    oldStart: hunk.oldStart,
    oldEnd: hunk.oldEnd + 1,
    newStart: hunk.newStart,
    newEnd: hunk.newEnd + 1,
    newContent: hunk.newContent.concat(hunk.nextLine),
  };
}
