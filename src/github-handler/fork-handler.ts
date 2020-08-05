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

import {RepoDomain} from '../types';
import {Octokit} from '@octokit/rest';
import {logger} from '../logger';

/**
 * Fork the GitHub owner's repository.
 * Returns the fork owner and fork repo if successful. Otherwise throws error.
 *
 * If fork already exists no new fork is created, no error occurs, and the existing Fork data is returned
 * with the `updated_at` + any historical repo changes.
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} upstream upstream repository information
 * @returns {Promise<RepoDomain>} the forked repository name, as well as the owner of that fork
 */
async function fork(
  octokit: Octokit,
  upstream: RepoDomain
): Promise<RepoDomain> {
  try {
    const forkedRepo = (
      await octokit.repos.createFork({
        owner: upstream.owner,
        repo: upstream.repo,
      })
    ).data;
    logger.info(`Fork successfully exists on ${upstream.repo}`);
    return {
      repo: forkedRepo.name,
      owner: forkedRepo.owner.login,
    };
  } catch (err) {
    logger.error('Error when forking');
    throw Error(err.toString());
  }
}

export {fork};
