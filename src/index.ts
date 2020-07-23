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
  CreatePullRequestUserOptions,
  RepoDomain,
  BranchDomain,
  FileData,
} from './types';
import {logger, setupLogger} from './logger';
import {addPullRequestDefaults} from './default-options-handler';
import {
  changeSetHasCorrectTypes,
  hasEmptyStringOption,
  optionsHasCorrectTypes,
  EmtpyStringError,
  isNullOrUndefined,
} from './parameters-handler';

/**
 * Make a new GitHub Pull Request with a set of changes applied on top of primary branch HEAD.
 * The changes are committed into a new branch based on the upstream repository options using the authenticated Octokit account.
 * Then a Pull Request is made from that branch.
 * If the upstream
 * If changes are empty then the workflow will not run.
 * Rethrows an HttpError if Octokit GitHub API returns an error. HttpError Octokit access_token and client_secret headers redact all sensitive information.
 * @param {Octokit} octokit The authenticated octokit instance, instantiated with an access token having permissiong to create a fork on the target repository
 * @param {Changes} changes A set of changes. The changes may be empty
 * @param {CreatePullRequestUserOptions} options The configuration for interacting with GitHub provided by the user.
 * @param {Logger} logger The logger instance (optional).
 * @returns {Promise<void>} a void promise
 */
async function createPullRequest(
  octokit: Octokit,
  changes: Changes | null | undefined,
  options: CreatePullRequestUserOptions,
  loggerOption?: Logger
): Promise<void> {
  setupLogger(loggerOption);
  changes = changes as Changes; // For TypeScript compiling purposes
  if (!changeSetHasCorrectTypes(changes)) {
    throw new TypeError(
      'The provided change set object does not match what is required.'
    );
  }
  // if null undefined, or the empty map then no changes have been provided.
  // Do not execute GitHub workflow
  if (isNullOrUndefined(changes) || changes.size === 0) {
    logger.info(
      'Empty change set provided. No changes need to be made. Cancelling workflow.'
    );
    return;
  }
  const gitHubConfigs = addPullRequestDefaults(options);
  if (!optionsHasCorrectTypes(gitHubConfigs)) {
    throw new TypeError(
      'The provided pull request options object does not match what is required.'
    );
  }
  if (hasEmptyStringOption(gitHubConfigs)) {
    throw new EmtpyStringError(
      'String type properties on create new Pull Request configurations must not be empty strings'
    );
  }
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
  await handler.openPullRequest(
    octokit,
    upstream,
    originBranch,
    description,
    gitHubConfigs.maintainersCanModify,
    gitHubConfigs.primary
  );
  logger.info('Finished PR workflow');
}

/**
 * Convert a Map<string,string> or {[path: string]: string}, where the key is the relative file path in the repository,
 * and the value is the text content. The files will be converted to a Map also containing the file mode information '100644'
 * @param {{[path: string]: string} | Map<string, string>} textFiles a map/object where the key is the relative file path and the value is the text file content
 * @returns {Changes} Map of the file path to the string file content and the file mode '100644'
 */
function parseTextFiles(
  textFiles: {[path: string]: string} | Map<string, string>
): Changes {
  const changes = new Map<string, FileData>();
  if (textFiles instanceof Map) {
    textFiles.forEach((content: string, path: string) => {
      if (typeof path !== 'string' || typeof content !== 'string') {
        throw TypeError(
          'The file changeset provided must have a string key and a string value'
        );
      }
      changes.set(path, new FileData(content));
    });
  } else {
    for (const [path, content] of Object.entries(textFiles)) {
      if (typeof path !== 'string' || typeof content !== 'string') {
        throw TypeError(
          'The file changeset provided must have a string key and a string value'
        );
      }
      changes.set(path, new FileData(content));
    }
  }
  return changes;
}

export {createPullRequest, parseTextFiles};
