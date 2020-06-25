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

import {Suggester} from '../application';
import {Files} from '../types';

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
  app: Suggester,
  changes: Files,
  owner: string,
  repoName: string,
  branchHeadSHA: string
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
    await app.octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: branchHeadSHA,
    })
  ).data.tree.sha;
  const treeSHA = (
    await app.octokit.git.createTree({
      owner,
      repo: repoName,
      tree,
      base_tree: oldTreeSHA,
    })
  ).data.sha;
  return treeSHA;
}

async function commitToBranch(
  app: Suggester,
  branchHead: string,
  treeSHA: string,
  owner: string,
  repoName: string
) {
  const commitData = (
    await app.octokit.git.createCommit({
      owner,
      repo: repoName,
      message: 'Third-Party Changes',
      tree: treeSHA,
      parents: [branchHead],
    })
  ).data;
  app.log.info(`Successfully updated commit. See commit at ${commitData.url}`);
  return commitData.sha;
}

async function updateBranchReference(
  app: Suggester,
  newSHA: string,
  branchName: string,
  owner: string,
  repo: string
) {
  const refData = (
    await app.octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: newSHA,
    })
  ).data;
  app.log.info(`Successfully updated reference. See ref at ${refData.url}`);
}

/**
 * Given a set of changes, apply the commit(s) on top of the given branch's head and upload it to GitHub
 * @param app the Suggester instance
 * @param changes the set of repository changes
 * @param branchHeadSHA the base of the new commit(s)
 * @param workerBranchName the branch that will contain the new changes
 * @returns null
 */
async function commitAndPush(
  app: Suggester,
  changes: Files,
  branchHeadSHA: string,
  workerBranchName: string
) {
  const owner = app.gitHubContext.workerOwner;
  const repoName = app.gitHubContext.workerRepo;
  if (!(owner && repoName)) {
    app.log.error(
      `Aborting commit because owner is ${owner} and the repository is ${repoName}`
    );
    return;
  }
  const treeSHA = await createTree(
    app,
    changes,
    owner,
    repoName,
    branchHeadSHA
  );
  if (!treeSHA) return;
  const commitSHA = await commitToBranch(
    app,
    branchHeadSHA,
    treeSHA,
    owner,
    repoName
  );
  await updateBranchReference(
    app,
    commitSHA,
    workerBranchName,
    owner,
    repoName
  );
}

export {commitAndPush};
