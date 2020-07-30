#!/usr/bin/env node

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

import * as yargs from 'yargs';
import {Changes, CreatePullRequestUserOptions, Octokit} from '../types';
import * as git from './handle-git-dir-change';
import {createPullRequest} from '../';
import {logger, setupLogger} from '../logger';

const CREATE_PR_COMMAND = 'pr';

// tslint:disable:no-unused-expression
// yargs actually is a used expression. TS-lint does not detect it.
yargs
  .scriptName('code-suggest')
  .usage('$0 pr [args]')
  .command(CREATE_PR_COMMAND, 'Create a new pull request', {
    'upstream-repo': {
      alias: 'r',
      demandOption: true,
      describe: 'Required. The repository to create the fork off of.',
      type: 'string',
    },
    'upstream-owner': {
      alias: 'o',
      demandOption: true,
      describe: 'Required. The owner of the upstream repository.',
      type: 'string',
    },
    description: {
      alias: 'd',
      demandOption: true,
      describe: 'Required. The GitHub Pull Request description',
      type: 'string',
    },
    title: {
      alias: 't',
      demandOption: true,
      describe: 'Required. The title of the Pull Request.',
      type: 'string',
    },
    branch: {
      alias: 'b',
      describe: 'The name of the working branch to apply changes to.',
      default: 'code-suggestion',
      type: 'string',
    },
    message: {
      alias: 'm',
      demandOption: true,
      describe: 'Required. The GitHub commit message.',
      type: 'string',
    },
    primary: {
      alias: 'p',
      describe:
        "The primary upstream branch to open a Pull Request against. Default is 'master'.",
      default: 'master',
      type: 'string',
    },
    force: {
      alias: 'f',
      describe:
        'Whether or not to force push the current reference HEAD against the remote reference HEAD. Default is false.',
      default: false,
      type: 'boolean',
    },
    'maintainers-can-modify': {
      alias: 'modify',
      describe:
        'Whether or not maintainers can modify the pull request. Default is true.',
      default: true,
      type: 'boolean',
    },
    'git-dir': {
      describe:
        'Required. The location of any un-tracked changes that should be made into a pull request. Files in the .gitignore are ignored.',
      type: 'string',
      demandOption: true,
    },
  })
  .check(argv => {
    for (const key in argv) {
      if (typeof argv[key] === 'string' && !argv[key]) {
        throw Error(
          `String parameters cannot be provided empty values. Parameter \'${key}\' was given an empty value\'`
        );
      }
    }
    if (argv.files !== undefined && argv['git-dir'] !== undefined) {
      throw Error("'files' or exclusively 'git-dir' options must be defined");
    }
    return true;
  })
  .demandCommand(1, 'A minimum of 1 command must be specified')
  .help().argv;

function setUserCreatePullRequestOptions(): CreatePullRequestUserOptions {
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
  };
}

/**
 * Parse yargs, get change object, invoke framework-core library!
 */
async function main() {
  setupLogger();
  const options = setUserCreatePullRequestOptions();
  if (!process.env.ACCESS_TOKEN) {
    throw Error('The ACCESS_TOKEN should not be undefined');
  }
  let changes: Changes;
  const octokit = new Octokit({auth: process.env.ACCESS_TOKEN});
  switch (yargs.argv._[0]) {
    case CREATE_PR_COMMAND:
      changes = await git.getChanges((yargs.argv['git-dir'] as string));
      break;
    default:
      // yargs should have caught this.
      throw Error(`Unhandled command detected: ${yargs.argv._[0]}`);
  }
  await createPullRequest(octokit, changes, options, logger);
}

main().catch(err => {
  logger.error('Workflow failed');
  throw err;
});
