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

import {Logger, Octokit, RepoDomain} from '../types';

const REF_PREFIX = 'refs/heads/';
const DEFAULT_PRIMARY_BRANCH = 'master';

/**
 * Create a new branch reference with the ref prefix
 * @param {string} branchName name of the branch
 */
function createRef(branchName: string) {
  return REF_PREFIX + branchName;
}

/**
 * get branch commit HEAD SHA of a repository
 * Throws an error if the branch cannot be found
 * @param {Logger} logger The logger instance
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin The domain information of the remote origin repository
 * @param {string} branch the name of the branch
 * @returns {Promise<string>} branch commit HEAD SHA
 */
async function getBranchHead(
  logger: Logger,
  octokit: Octokit,
  origin: RepoDomain,
  branch: string
): Promise<string> {
  const branchData = (
    await octokit.repos.getBranch({
      owner: origin.owner,
      repo: origin.repo,
      branch,
    })
  ).data;
  logger.info(
    `Successfully found primary branch HEAD sha \"${branchData.commit.sha}\".`
  );
  return branchData.commit.sha;
}

/**
 * Create a GitHub branch given a remote origin.
 * Throws an exception if octokit fails, or if the base branch is invalid
 * @param {Logger} logger The logger instance
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin The domain information of the remote origin repository
 * @param {string} name The branch name to create on the origin repository
 * @param {string} baseBranch the name of the branch to base the new branch off of. Default is master
 * @returns {Promise<string>} the base SHA for subsequent commits to be based off for the origin branch
 */
async function branch(
  logger: Logger,
  octokit: Octokit,
  origin: RepoDomain,
  name: string,
  baseBranch: string = DEFAULT_PRIMARY_BRANCH
): Promise<string> {
  // create branch from primary branch HEAD SHA
  try {
    const baseSHA = await getBranchHead(logger, octokit, origin, baseBranch);
    const refData = (
      await octokit.git.createRef({
        owner: origin.owner,
        repo: origin.repo,
        ref: createRef(name),
        sha: baseSHA,
      })
    ).data;
    logger.info(`Successfully created branch at ${refData.url}`);
    return baseSHA;
  } catch (err) {
    logger.error('Error when creating branch');
    throw Error(err);
  }
}

export {branch, getBranchHead, createRef};
