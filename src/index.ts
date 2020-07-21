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

import * as handler from './github-handler';
import {
  Changes,
  Description,
  Logger,
  Octokit,
  GitHubPrUserOptions,
  RepoDomain,
  BranchDomain,
} from './types';
import {logger, setupLogger} from './logger';
import {addPrDefaults} from './default-options-handler';

/**
 * Make GitHub Pull Request with a set of changes applied on top of primary branch HEAD
 * Rethrows an HttpError if Octokit GitHub API returns an error. HttpError Octokit access_token and client_secret headers redact all sensitive information
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {Changes} changes A set of changes
 * @param {GitHubPrUserOptions} gitHubOptions The configuration for interacting with GitHub provided by the user
 * @param {Logger} logger The logger instance
 * @returns {Promise<void>}
 */
async function makePr(
  octokit: Octokit,
  changes: Changes,
  gitHubOptions: GitHubPrUserOptions,
  loggerOption?: Logger
): Promise<void> {
  setupLogger(loggerOption);
    const gitHubConfigs = addPrDefaults(gitHubOptions);
    logger.info('Starting GitHub PR workflow...');
    const upstream: RepoDomain = {
      owner: gitHubConfigs.upstreamOwner,
      repo: gitHubConfigs.upstreamRepo,
    };
    const origin: RepoDomain = await handler.fork(octokit, upstream);
    const originBranch: BranchDomain = {
      ...origin,
      branch: gitHubConfigs.branch,
    };
    const refHeadSha: string = await handler.branch(
      octokit,
      origin,
      originBranch.branch,
      gitHubConfigs.primary
    );
    await handler.commitAndPush(
      octokit,
      refHeadSha,
      changes,
      originBranch,
      gitHubConfigs.message
    );

    const description: Description = {
      body: gitHubConfigs.description,
      title: gitHubConfigs.title,
    };
    await handler.openPr(
      octokit,
      upstream,
      originBranch,
      description,
      gitHubConfigs.maintainersCanModify,
      gitHubConfigs.primary
    );
    logger.info('Finished PR workflow');
}

export {makePr};
