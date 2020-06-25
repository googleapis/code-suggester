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

import {execSync} from 'child_process';
import {Files} from '../../types';
import {CLISuggester} from '../../application';

/**
 * Find the working path of the directory
 */
function findRepoRoot(): string {
  return execSync('git rev-parse --show-toplevel')
    .toString()
    .slice(0, -1);
}

/**
 * Get the changes of the current project
 */
function parseChanges(cwd: string): Files {
  // a list of the paths of files that have been updated
  const paths: string[] = execSync('git diff --name-only', {cwd})
    .toString()
    .split('\n');
  paths.pop(); // remove the trailing new line

  // get updated file contents
  // TODO - handle memory constraint
  const changes: Files = {};
  for (let i = 0; i < paths.length; i++) {
    const fileContents: string = execSync(`cat ${paths[i]}`, {cwd}).toString();
    changes[paths[i]] = fileContents;
  }
  return changes;
}

/**
 * gather the changes
 * @param app
 */
async function makeChanges(app: CLISuggester): Promise<Files> {
  const repoRoot = findRepoRoot();
  return new Promise((resolve, reject) => {
    try {
      const files: Files = parseChanges(repoRoot);
      resolve(files);
    } catch (err) {
      app.log.error('Error in handling CLI changes ');
      resolve();
    }
  });
}
export {makeChanges};
