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
const mainBranch = 'master';

function getBranchFromRef(ref: string) {
  return ref.split('/')[2];
}

function getUniqueBranchName(
  branchName: string,
  conflictingNames: string[]
): string {
  if (!conflictingNames.length) return branchName;
  else if (conflictingNames.length === 1) return `${branchName}-2`;
  conflictingNames.sort();
  const lastName = conflictingNames[conflictingNames.length - 1];
  const splitName = lastName.split('-');
  const highestCount = Number(splitName[splitName.length - 1]) + 1;
  return `${branchName}-${highestCount}`;
}

/**
 * Create a GitHub branch given a destination repo and destination owner/organization
 * @param app the Suggester instance
 * @returns the base SHA for subsequent commits to be based off, and the branch name to apply commits to
 */
async function branch(app: Suggester) {
  if (!(app.gitHubContext.workerOwner && app.gitHubContext.workerRepo)) {
    return {mainHeadSHA: undefined, branchName: undefined};
  }
  let mainHeadSHA: string | undefined;

  const branches = (
    await app.octokit.repos.listBranches({
      owner: app.gitHubContext.workerOwner,
      repo: app.gitHubContext.workerRepo,
    })
  ).data;

  // handle duplicate branch names
  const conflictingNames: string[] = [];
  branches.forEach(branch => {
    if (branch.name.includes(app.gitHubContext.branchName)) {
      conflictingNames.push(branch.name);
    }
  });
  const uniqueName = getUniqueBranchName(
    app.gitHubContext.branchName,
    conflictingNames
  );

  mainHeadSHA = branches.find(branch => branch.name === mainBranch)?.commit.sha;
  if (mainHeadSHA) {
    const newBranch = (
      await app.octokit.git.createRef({
        owner: app.gitHubContext.workerOwner,
        repo: app.gitHubContext.workerRepo,
        ref: `refs/heads/${uniqueName}`,
        sha: mainHeadSHA,
      })
    ).data;
    app.log.info(`Created branch. See ${newBranch.url} for more details`);
    return {mainHeadSHA, workerBranchName: getBranchFromRef(newBranch.ref)};
  }
  return {mainHeadSHA, workerBranchName: undefined};
}

export {branch};
