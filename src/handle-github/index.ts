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

import {fork} from './fork';
import {branch} from './branch';
import {commitAndPush} from './push';
import {makePR} from './pr';
import {Files, GitHubContext, Logger} from '../types';
import {Octokit} from '@octokit/rest';

/**
 *
 * @param changes A set of changes
 * @param gitHubContext The configuration for interacting with GitHub
 * @param logger The logger instance
 * @param octokit The authenticated octokit instance
 */
async function runGitHub(
  changes: Files,
  gitHubContext: GitHubContext,
  logger: Logger,
  octokit: Octokit
) {
  logger.debug('Starting github workflow');
  const {newRepo, newOwner} = await fork(gitHubContext, logger, octokit);
  gitHubContext.workerOwner = newOwner;
  gitHubContext.workerRepo = newRepo;
  const {mainHeadSHA, workerBranchName} = await branch(
    gitHubContext,
    logger,
    octokit
  );
  if (!(mainHeadSHA && workerBranchName)) {
    return;
  }
  await commitAndPush(
    mainHeadSHA,
    changes,
    gitHubContext,
    logger,
    octokit,
    workerBranchName
  );
  await makePR(gitHubContext, logger, octokit, workerBranchName);
}

export {runGitHub};
