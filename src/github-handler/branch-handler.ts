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

const refPrefix = 'refs/heads/';
const masterBranch = 'master';

/**
 * Create a new branch reference with the ref prefix
 * @param {string} branchName name of the branch
 */
function createRef(branchName: string) {
  return refPrefix + branchName;
}

/**
 * Return the length of the GitHub reference prefix
 */
function refPrefixLen() {
  return refPrefix.length;
}

/**
 * get primary branch commit HEAD SHA of a repository
 * Throws an error if the repository cannot be found
 * or if the primary branch is invalid
 * @param {Logger} logger The logger instance
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin The domain information of the remote origin repository
 * @param {string} originBranchName The branch name to create on the origin repository
 * @param {string} primaryBranch the name of the primary branch
 * @returns {Promise<string>} primary branch commit HEAD SHA
 */
async function getPrimaryBranchSHA(
  logger: Logger,
  octokit: Octokit,
  origin: RepoDomain,
  primaryBranch: string
): Promise<string> {
  const branches = (
    await octokit.repos.listBranches({owner: origin.owner, repo: origin.repo})
  ).data;

  const primaryBranchData = branches.find(
    branch => branch.name === primaryBranch
  );

  // GitHub should always at least have a main branch
  // this check is needed so main branch data can be accessed
  if (!primaryBranchData) {
    logger.error("Error in listing origin repository's branches.");
    throw Error(
      `No default branch named: ${primaryBranch} found on repo ${origin.owner}/${origin.repo}`
    );
  }
  logger.info('Successfully found primary branch HEAD sha.');
  return primaryBranchData.commit.sha;
}

/**
 * Create a GitHub branch given a remote origin.
 * Throws an exception if octokit fails, or if the primary branch is invalid
 * @param {Logger} logger The logger instance
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin The domain information of the remote origin repository
 * @param {string} originBranchName The branch name to create on the origin repository
 * @param {string} primaryBranch the name of the primary branch. Default is master
 * @returns {Promise<string>} the base SHA for subsequent commits to be based off for the origin branch
 */
async function branch(
  logger: Logger,
  octokit: Octokit,
  origin: RepoDomain,
  originBranchName: string,
  primaryBranch: string = masterBranch
): Promise<string> {
  // create branch from primary branch HEAD SHA
  try {
    const upstreamHeadSHA = await getPrimaryBranchSHA(
      logger,
      octokit,
      origin,
      primaryBranch
    );
    await octokit.git.createRef({
      owner: origin.owner,
      repo: origin.repo,
      ref: createRef(originBranchName),
      sha: upstreamHeadSHA,
    });
    logger.info('Successfully created branch');
    return upstreamHeadSHA;
  } catch (err) {
    logger.error('Error when creating branch');
    throw Error(err.toString());
  }
}

export {branch, getPrimaryBranchSHA, refPrefixLen, createRef};
