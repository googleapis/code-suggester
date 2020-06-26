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

import {Files, GitHubContext, Logger} from '../types';
import {Octokit} from '@octokit/rest';

declare interface GitCreateTreeParamsTree {
  path?: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
  type?: 'blob' | 'tree' | 'commit';
  sha?: string | null;
  content?: string;
}

/**
 * Create a github tree and return its SHA
 * @param changes
 * @param owner
 * @param repoName
 */
async function createTree(
  branchHeadSHA: string,
  changes: Files,
  octokit: Octokit,
  owner: string,
  repoName: string
): Promise<string> {
  const tree: GitCreateTreeParamsTree[] = [];
  for (const path in changes) {
    if (!path) continue;
    tree.push({
      path,
      mode: '100644',
      type: 'blob',
      content: changes[path],
    });
  }
  const oldTreeSHA = (
    await octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: branchHeadSHA,
    })
  ).data.tree.sha;
  const treeSHA = (
    await octokit.git.createTree({
      owner,
      repo: repoName,
      tree,
      base_tree: oldTreeSHA,
    })
  ).data.sha;
  return treeSHA;
}

async function commitToBranch(
  branchHead: string,
  logger: Logger,
  octokit: Octokit,
  owner: string,
  repoName: string,
  treeSHA: string
) {
  const commitData = (
    await octokit.git.createCommit({
      owner,
      repo: repoName,
      message: 'Third-Party Changes',
      tree: treeSHA,
      parents: [branchHead],
    })
  ).data;
  logger.info(`Successfully updated commit. See commit at ${commitData.url}`);
  return commitData.sha;
}

async function updateBranchReference(
  branchName: string,
  octokit: Octokit,
  logger: Logger,
  newSHA: string,
  owner: string,
  repo: string
) {
  const refData = (
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: newSHA,
    })
  ).data;
  logger.info(`Successfully updated reference. See ref at ${refData.url}`);
}

/**
 * Given a set of changes, apply the commit(s) on top of the given branch's head and upload it to GitHub
 * @param branchHeadSHA the base of the new commit(s)
 * @param changes the set of repository changes
 * @param gitHubContext The configuration for interacting with GitHub
 * @param logger The logger instance
 * @param octokit The authenticated octokit instance
 * @param forkedBranchName the branch that will contain the new changes
 * @returns null
 */
async function commitAndPush(
  branchHeadSHA: string,
  changes: Files,
  gitHubContext: GitHubContext,
  logger: Logger,
  octokit: Octokit,
  forkedBranchName: string
) {
  const owner = gitHubContext.forkedOwner;
  const repoName = gitHubContext.forkedRepo;
  if (!(owner && repoName)) {
    logger.error(
      `Aborting commit because owner is ${owner} and the repository is ${repoName}`
    );
    return;
  }
  const treeSHA = await createTree(
    branchHeadSHA,
    changes,
    octokit,
    owner,
    repoName
  );
  if (!treeSHA) return;
  const commitSHA = await commitToBranch(
    branchHeadSHA,
    logger,
    octokit,
    owner,
    repoName,
    treeSHA
  );
  await updateBranchReference(
    forkedBranchName,
    octokit,
    logger,
    commitSHA,
    owner,
    repoName
  );
}

export {commitAndPush};
