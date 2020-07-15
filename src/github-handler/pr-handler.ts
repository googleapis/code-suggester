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

import {BranchDomain, Description, Logger, Octokit, RepoDomain} from '../types';

const DEFAULT_PRIMARY = 'master';

/**
 * Create a GitHub PR on the upstream organization's repo
 * Throws an error if the GitHub API fails
 * @param {Logger} logger The logger instance
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} upstream The upstream repository
 * @param {BranchDomain} origin The remote origin information that contains the origin branch
 * @param {Description} description The pull request title and detailed description
 * @param {boolean} maintainersCanModify Whether or not maintainers can modify the pull request. Default is true
 * @param {string} upstreamPrimary The upstream repository's primary branch. Default is master.
 * @returns {Promise<void>}
 */
async function openPR(
  logger: Logger,
  octokit: Octokit,
  upstream: RepoDomain,
  origin: BranchDomain,
  description: Description,
  maintainersCanModify = true,
  upstreamPrimary: string = DEFAULT_PRIMARY
): Promise<void> {
  // TODO - autosync fork, update branch, and re-apply changes
  const pullResponseData = (
    await octokit.pulls.create({
      owner: upstream.owner,
      repo: origin.repo,
      title: description.title,
      head: `${origin.owner}:${origin.branch}`,
      base: upstreamPrimary,
      body: description.body,
      maintainer_can_modify: maintainersCanModify,
    })
  ).data;
  logger.info(
    `Successfully opened pull request available at url: ${pullResponseData.url}.`
  );
}

export {openPR};
