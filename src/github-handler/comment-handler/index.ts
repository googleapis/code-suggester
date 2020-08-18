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

import {RawChanges, RepoDomain} from '../../types';
import {getPullRequestScope} from './remote-patch-ranges-handler';
import {Octokit} from '@octokit/rest';
import {getSuggestionPatches} from './suggestion-patch-handler';

/**
 * Comment on a Pull Request
 * @param {Octokit} octokit authenticated octokit isntance
 * @param {RepoDomain} remote the Pull Request repository
 * @param {number} pullNumber the Pull Request number
 * @param {number} pageSize the number of files to comment on // TODO pagination
 * @param {RawChanges} rawChanges the old and new contents of the files to suggest
 */
export async function comment(
  octokit: Octokit,
  remote: RepoDomain,
  pullNumber: number,
  pageSize: number,
  rawChanges: RawChanges
): Promise<void> {
  const {invalidFiles, validFileLines} = await getPullRequestScope(
    octokit,
    remote,
    pullNumber,
    pageSize
  );
  getSuggestionPatches(rawChanges, invalidFiles, validFileLines);
  // TODO get the raw file content from the new range of the hunk and make a PR with that
}
