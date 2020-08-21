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

import {Octokit} from '@octokit/rest';
import {Hunk, RepoDomain} from '../../../types';
import {buildErrorMessage} from './message-handler';
import {logger} from '../../../logger';

/**
 * From the invalid hunks provided, make a comment on the pull request
 * timeline detailing what hunks and files could not be commented on.
 * @param octokit
 * @param invalidHunks
 * @param remote
 * @param pullNumber
 */
export async function makeTimeLineComment(
  octokit: Octokit,
  invalidHunks: Map<string, Hunk[]>,
  remote: RepoDomain,
  pullNumber: number
): Promise<void> {
  try {
    const errorMessage = buildErrorMessage(invalidHunks);
    if (errorMessage) {
      await octokit.issues.createComment({
        owner: remote.owner,
        repo: remote.repo,
        issue_number: pullNumber,
        body: errorMessage,
      });
    }
  } catch (err) {
    logger.error('Failed to make a timeline comment');
    throw err;
  }
}
