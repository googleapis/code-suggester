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

import {GitHubContext, Logger} from '../types';
import {Octokit} from '@octokit/rest';

/**
 * Create a GitHub PR on the main organization's repo
 * @param gitHubContext The configuration for interacting with GitHub
 * @param logger The logger instance
 * @param octokit The authenticated octokit instance
 * @param forkedBranchName the branch name that contains the changes
 */
async function makePR(
  gitHubContext: GitHubContext,
  logger: Logger,
  octokit: Octokit,
  forkedBranchName: string
) {
  // TODO - handle when there is no fork instance
  if (!gitHubContext.forkedRepo) {
    logger.error('PR is not made because there is no working repo');
    return;
  }
  const isForkOutOfDate = false;
  if (isForkOutOfDate) {
    logger.debug('Fork is out of synch');
    // TODO - autosync fork, update branch, and re-apply changes
  }
  await octokit.pulls.create({
    owner: gitHubContext.mainOwner,
    repo: gitHubContext.forkedRepo,
    title: gitHubContext.prTitle,
    head: `${gitHubContext.forkedOwner}:${forkedBranchName}`,
    base: 'master',
  });
}

export {makePR};
