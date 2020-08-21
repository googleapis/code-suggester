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

import {Hunk} from '../../../types';

function hunkErrorMessage(hunk: Hunk): string {
  return `  * lines ${hunk.oldStart}-${hunk.oldEnd}`;
}

function fileErrorMessage(filename: string, hunks: Hunk[]): string {
  return `* ${filename}\n` + hunks.map(hunkErrorMessage).join('\n');
}

export function buildErrorMessage(invalidHunks: Map<string, Hunk[]>): string {
  if (invalidHunks.size === 0) {
    return '';
  }
  return (
    'Some suggestions could not be made:\n' +
    Array.from(invalidHunks, ([filename, hunks]) =>
      fileErrorMessage(filename, hunks)
    ).join('\n')
  );
}
