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
 * Fork the GitHub owner's repository
 * If fork already exists no new fork is created and no error occurs
 * @param gitHubContext The configuration for interacting with GitHub
 * @param logger The logger instance
 * @param octokit The authenticated octokit instance
 * @returns the forked repository name, as well as the owner of that fork
 */
async function fork(
  gitHubContext: GitHubContext,
  logger: Logger,
  octokit: Octokit
) {
  const forkedRepo = (
    await octokit.repos.createFork({
      owner: gitHubContext.mainOwner,
      repo: gitHubContext.mainRepo,
    })
  ).data;
  logger.debug('Fork was either successful, or fork already exists');
  // TODO autosync
  return {
    newRepo: forkedRepo.name,
    newOwner: forkedRepo.owner.login,
  };
}

export {fork};
