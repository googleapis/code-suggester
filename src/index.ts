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
  CreatePullRequestUserOptions,
  RepoDomain,
  BranchDomain,
  FileData,
} from './types';
export {Changes} from './types';
import {Octokit} from '@octokit/rest';
import {Logger} from 'pino';
import {logger, setupLogger} from './logger';
import {addPullRequestDefaults} from './default-options-handler';
import * as retry from 'async-retry';

/**
 * Make a new GitHub Pull Request with a set of changes applied on top of primary branch HEAD.
 * The changes are committed into a new branch based on the upstream repository options using the authenticated Octokit account.
 * Then a Pull Request is made from that branch.
 *
 * Also throws error if git data from the fork is not ready in 5 minutes.
 *
 * From the docs
 * https://developer.github.com/v3/repos/forks/#create-a-fork
 * """
 * Forking a Repository happens asynchronously.
 * You may have to wait a short period of time before you can access the git objects.
 * If this takes longer than 5 minutes, be sure to contact GitHub Support or GitHub Premium Support.
 * """
 *
 * If changes are empty then the workflow will not run.
 * Rethrows an HttpError if Octokit GitHub API returns an error. HttpError Octokit access_token and client_secret headers redact all sensitive information.
 * @param {Octokit} octokit The authenticated octokit instance, instantiated with an access token having permissiong to create a fork on the target repository
 * @param {Changes | null | undefined} changes A set of changes. The changes may be empty
 * @param {CreatePullRequestUserOptions} options The configuration for interacting with GitHub provided by the user.
 * @param {Logger} logger The logger instance (optional).
 * @returns {Promise<number>} a void promise
 */
async function createPullRequest(
  octokit: Octokit,
  changes: Changes | null | undefined,
  options: CreatePullRequestUserOptions,
  loggerOption?: Logger
): Promise<number> {
  setupLogger(loggerOption);
  // if null undefined, or the empty map then no changes have been provided.
  // Do not execute GitHub workflow
  if (changes === null || changes === undefined || changes.size === 0) {
    logger.info(
      'Empty change set provided. No changes need to be made. Cancelling workflow.'
    );
    return 0;
  }
  const gitHubConfigs = addPullRequestDefaults(options);
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
  const refHeadSha: string = await retry(
    async () =>
      await handler.branch(
        octokit,
        origin,
        upstream,
        originBranch.branch,
        gitHubConfigs.primary
      ),
    {
      retries: 5,
      factor: 2.8411, // https://www.wolframalpha.com/input/?i=Sum%5B3000*x%5Ek%2C+%7Bk%2C+0%2C+4%7D%5D+%3D+5+*+60+*+1000
      minTimeout: 3000,
      randomize: false,
      onRetry: () => {
        logger.info('Retrying at a later time...');
      },
    }
  );

  await handler.commitAndPush(
    octokit,
    refHeadSha,
    changes,
    originBranch,
    gitHubConfigs.message,
    gitHubConfigs.force
  );

  const description: Description = {
    body: gitHubConfigs.description,
    title: gitHubConfigs.title,
  };
  const prNumber = await handler.openPullRequest(
    octokit,
    upstream,
    originBranch,
    description,
    gitHubConfigs.maintainersCanModify,
    gitHubConfigs.primary
  );
  logger.info(`Successfully opened pull request: ${prNumber}.`);
  return prNumber;
}

/**
 * Convert a Map<string,string> or {[path: string]: string}, where the key is the relative file path in the repository,
 * and the value is the text content. The files will be converted to a Map also containing the file mode information '100644'
 * @param {Object<string, string | null> | Map<string, string | null>} textFiles a map/object where the key is the relative file path and the value is the text file content
 * @returns {Changes} Map of the file path to the string file content and the file mode '100644'
 */
function parseTextFiles(
  textFiles: {[path: string]: string | null} | Map<string, string | null>
): Changes {
  const changes = new Map<string, FileData>();
  if (textFiles instanceof Map) {
    textFiles.forEach((content: string | null, path: string) => {
      if (
        typeof path !== 'string' ||
        (content !== null && typeof content !== 'string')
      ) {
        throw TypeError(
          'The file changeset provided must have a string key and a string/null value'
        );
      }
      changes.set(path, new FileData(content));
    });
  } else {
    for (const [path, content] of Object.entries(textFiles)) {
      if (
        typeof path !== 'string' ||
        (content !== null && typeof content !== 'string')
      ) {
        throw TypeError(
          'The file changeset provided must have a string key and a string/null value'
        );
      }
      changes.set(path, new FileData(content));
    }
  }
  return changes;
}

export {createPullRequest, parseTextFiles};
