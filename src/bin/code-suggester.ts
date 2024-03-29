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
import {CREATE_PR_COMMAND, REVIEW_PR_COMMAND, main} from './workflow';
import {logger} from '../logger';

yargs
  .scriptName('code-suggester')
  .usage('$0 <command> [args]')
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
        "The primary upstream branch to open a Pull Request against. Default is 'main'.",
      default: 'main',
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
    fork: {
      describe:
        'Whether or not to attempt forking to a separate repository. Default is true.',
      default: true,
      type: 'boolean',
    },
    labels: {
      describe:
        'The list of labels to add to the pull request. Default is none.',
      default: [],
      type: 'array',
    },
    'files-per-commit': {
      describe: 'Number of files per commit. Defaults to 100',
      default: 100,
      type: 'number',
    },
  })
  .command(REVIEW_PR_COMMAND, 'Review an open pull request', {
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
    'pull-number': {
      alias: 'p',
      demandOption: true,
      describe: 'Required. The pull request number to comment on.',
      type: 'number',
    },
    'git-dir': {
      describe:
        'Required. The location of any un-tracked changes that should be made into pull request comments. Files in the .gitignore are ignored.',
      type: 'string',
      demandOption: true,
    },
  })
  .check(argv => {
    for (const key in argv) {
      if (typeof argv[key] === 'string' && !argv[key]) {
        throw Error(
          `String parameters cannot be provided empty values. Parameter ${key} was given an empty value`
        );
      }
    }
    return true;
  })
  .demandCommand(1, 'A minimum of 1 command must be specified')
  .help().argv;

/**
 * Parse yargs, get change object, invoke framework-core library!
 */
main().catch(err => {
  logger.error(err);
  /* eslint-disable  no-process-exit */
  // If just rethrow, the application exists with code 0.
  // Need exit code 1 to fail GitHub Actions step if the process fails.
  process.exit(1);
});
