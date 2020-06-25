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

/**
 * Create a GitHub PR on the main organization's repo
 * @param app the Suggester instance
 * @param workerBranchName the branch name that contains the changes
 */
async function makePR(app: Suggester, workerBranchName: string) {
  // TODO - handle when there is no fork instance
  if (!app.gitHubContext.workerRepo) {
    app.log.error('PR is not made because there is no working repo');
    return;
  }
  const isForkOutOfDate = false;
  if (isForkOutOfDate) {
    app.log.debug('Fork is out of synch');
    // TODO - autosync fork, update branch, and re-apply changes
  }
  await app.octokit.pulls.create({
    owner: app.gitHubContext.mainOwner,
    repo: app.gitHubContext.workerRepo,
    title: app.gitHubContext.prTitle,
    head: `${app.gitHubContext.workerOwner}:${workerBranchName}`,
    base: 'master',
  });
}

export {makePR};
