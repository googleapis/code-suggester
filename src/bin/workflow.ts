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

import {
  CreatePullRequestUserOptions,
  CreateReviewCommentUserOptions,
} from '../types';
import {Octokit} from '@octokit/rest';
import * as git from './handle-git-dir-change';
import {createPullRequest, reviewPullRequest} from '../';
import {logger, setupLogger} from '../logger';
import * as yargs from 'yargs';

export const CREATE_PR_COMMAND = 'pr';
export const REVIEW_PR_COMMAND = 'review';

/**
 * map yargs to user pull request otions
 */
export function coerceUserCreatePullRequestOptions(): CreatePullRequestUserOptions {
  return {
    upstreamRepo: yargs.argv.upstreamRepo as string,
    upstreamOwner: yargs.argv.upstreamOwner as string,
    message: yargs.argv.message as string,
    description: yargs.argv.description as string,
    title: yargs.argv.title as string,
    branch: yargs.argv.branch as string,
    force: yargs.argv.force as boolean,
    primary: yargs.argv.primary as string,
    maintainersCanModify: yargs.argv.maintainersCanModify as boolean,
    fork: yargs.argv.fork as boolean,
    labels: yargs.argv.labels as string[],
    logger,
    filesPerCommit: yargs.argv.filesPerCommit as number,
  };
}

/**
 * map yargs to user pull request otions
 */
export function coerceUserCreateReviewRequestOptions(): CreateReviewCommentUserOptions {
  return {
    repo: yargs.argv.upstreamRepo as string,
    owner: yargs.argv.upstreamOwner as string,
    pullNumber: yargs.argv.pullNumber as number,
    logger,
  };
}

async function createCommand() {
  const options = coerceUserCreatePullRequestOptions();
  const changes = await git.getChanges(yargs.argv['git-dir'] as string);
  const octokit = new Octokit({auth: process.env.ACCESS_TOKEN});
  console.log(options);
  await createPullRequest(octokit, changes, options);
}

async function reviewCommand() {
  const reviewOptions = coerceUserCreateReviewRequestOptions();
  const diffContents = await git.getDiffString(yargs.argv['git-dir'] as string);
  const octokit = new Octokit({auth: process.env.ACCESS_TOKEN});
  await reviewPullRequest(octokit, diffContents, reviewOptions);
}

/**
 * main workflow entrance
 */
export async function main() {
  try {
    setupLogger(console);
    if (!process.env.ACCESS_TOKEN) {
      throw Error('The ACCESS_TOKEN should not be undefined');
    }
    switch (yargs.argv._[0]) {
      case CREATE_PR_COMMAND:
        await createCommand();
        break;
      case REVIEW_PR_COMMAND:
        await reviewCommand();
        break;
      default:
        // yargs should have caught this.
        throw Error(`Unhandled command detected: ${yargs.argv._[0]}`);
    }
  } catch (err) {
    logger.error('Workflow failed');
    throw err;
  }
}
