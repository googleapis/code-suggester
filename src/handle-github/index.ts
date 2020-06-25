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
import {fork} from './fork';
import {branch} from './branch';
import {commitAndPush} from './push';
import {makePR} from './pr';
import {Files} from '../types';

async function runGitHub(app: Suggester, changes: Files) {
  app.log.debug('Starting github workflow');
  const {newRepo, newOwner} = await fork(app);
  app.gitHubContext.workerOwner = newOwner;
  app.gitHubContext.workerRepo = newRepo;
  const {mainHeadSHA, workerBranchName} = await branch(app);
  if (!(mainHeadSHA && workerBranchName)) {
    return;
  }
  await commitAndPush(app, changes, mainHeadSHA, workerBranchName);
  await makePR(app, workerBranchName);
}

export {runGitHub};
