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
import {CREATE_PR_COMMAND, main} from './workflow';

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

/**
 * Parse yargs, get change object, invoke framework-core library!
 */
main();
