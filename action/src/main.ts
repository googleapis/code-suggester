// Copyright 2022 Google LLC
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

import * as core from '@actions/core';
import {
  createPullRequest,
  reviewPullRequest,
  getChanges,
  getDiffString,
  CreatePullRequestUserOptions,
  CreateReviewCommentUserOptions,
} from 'code-suggester';
import {Octokit} from '@octokit/rest';

export async function run(): Promise<void> {
  try {
    const command = core.getInput('command', {required: true});
    const gitDir = core.getInput('git_dir');
    const octokit = new Octokit({auth: process.env.ACCESS_TOKEN});
    switch (command) {
      case 'pr': {
        const options = parsePullRequestOptions();
        const changes = await getChanges(gitDir);
        const pullRequestNumber = await createPullRequest(
          octokit,
          changes,
          options
        );
        if (pullRequestNumber) {
          core.setOutput('pull', pullRequestNumber);
        }
        break;
      }
      case 'review': {
        const options = parseReviewOptions();
        const changes = await getDiffString(gitDir);
        const reviewNumber = await reviewPullRequest(octokit, changes, options);
        if (reviewNumber) {
          core.setOutput('review', reviewNumber);
        }
        break;
      }
      default: {
        throw new Error(`Unsupported command '${command}'`);
      }
    }
  } catch (error) {
    console.log(error);
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function parsePullRequestOptions(): CreatePullRequestUserOptions {
  return {
    upstreamOwner: core.getInput('upstream_owner'),
    upstreamRepo: core.getInput('upstream_repo'),
    message: core.getInput('message', {required: true}),
    description: core.getInput('description', {required: true}),
    title: core.getInput('title', {required: true}),
    branch: core.getInput('branch', {required: true}),
    force: core.getBooleanInput('force'),
    primary: core.getInput('primary'),
    maintainersCanModify: core.getBooleanInput('maintainers_can_modify'),
    fork: core.getBooleanInput('fork'),
    labels: core.getMultilineInput('labels'),
    logger: console,
  };
}

function parseReviewOptions(): CreateReviewCommentUserOptions {
  return {
    owner: core.getInput('upstream_owner'),
    repo: core.getInput('upstream_repo'),
    pullNumber: parseInt(core.getInput('pull_number', {required: true})),
    logger: console,
  };
}

if (require.main === module) {
  run();
}
