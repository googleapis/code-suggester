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

import {logger} from '../logger';
import {RepoDomain} from '../types';
import {Octokit} from '@octokit/rest';

const REF_PREFIX = 'refs/heads/';
const DEFAULT_PRIMARY_BRANCH = 'master';

/**
 * Create a new branch reference with the ref prefix
 * @param {string} branchName name of the branch
 */
export function createRef(branchName: string) {
  return REF_PREFIX + branchName;
}

/**
 * get branch commit HEAD SHA of a repository
 * Throws an error if the branch cannot be found
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin The domain information of the remote origin repository
 * @param {string} branch the name of the branch
 * @returns {Promise<string>} branch commit HEAD SHA
 */
export async function getBranchHead(
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
  logger.info(`Successfully found branch HEAD sha "${branchData.commit.sha}".`);
  return branchData.commit.sha;
}

/**
 * Determine if there is a branch with the provided name in the remote GitHub repository
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} remote The domain information of the remote repository
 * @param {string} name The branch name to create on the repository
 * @returns {Promise<boolean>} if there is a branch already existing in the remote GitHub repository
 */
export async function existsBranchWithName(
  octokit: Octokit,
  remote: RepoDomain,
  name: string
): Promise<boolean> {
  const branches = (
    await octokit.repos.listBranches({
      owner: remote.owner,
      repo: remote.repo,
    })
  ).data;
  const match = branches.some(branch => branch.name === name);
  logger.info(
    `Existing remote branch ${name} found on ${remote.owner}/${remote.repo}`
  );
  return match;
}

/**
 * Create a branch on the remote repository if there is not an existing branch
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} remote The domain information of the remote origin repository
 * @param {string} name The branch name to create on the origin repository
 * @param {string} baseSha the sha that the base of the reference points to
 * @param {boolean} duplicate whether there is an existing branch or not
 * @returns {Promise<void>}
 */
export async function createBranch(
  octokit: Octokit,
  remote: RepoDomain,
  name: string,
  baseSha: string,
  duplicate: boolean
): Promise<void> {
  if (!duplicate) {
    const refData = (
      await octokit.git.createRef({
        owner: remote.owner,
        repo: remote.repo,
        ref: createRef(name),
        sha: baseSha,
      })
    ).data;
    logger.info(`Successfully created branch at ${refData.url}`);
  } else {
    logger.info('Skipping branch creation step...');
  }
}

/**
 * Create a GitHub branch given a remote origin.
 * Throws an exception if octokit fails, or if the base branch is invalid
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin The domain information of the remote origin repository
 * @param {RepoDomain} upstream The domain information of the remote upstream repository
 * @param {string} name The branch name to create on the origin repository
 * @param {string} baseBranch the name of the branch to base the new branch off of. Default is master
 * @returns {Promise<string>} the base SHA for subsequent commits to be based off for the origin branch
 */
export async function branch(
  octokit: Octokit,
  origin: RepoDomain,
  upstream: RepoDomain,
  name: string,
  baseBranch: string = DEFAULT_PRIMARY_BRANCH
): Promise<string> {
  // create branch from primary branch HEAD SHA
  try {
    const baseSha = await getBranchHead(octokit, upstream, baseBranch);
    const duplicate: boolean = await existsBranchWithName(
      octokit,
      origin,
      name
    );
    await createBranch(octokit, origin, name, baseSha, duplicate);
    return baseSha;
  } catch (err) {
    logger.error('Error when creating branch');
    throw err;
  }
}
