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

import {logger as defaultLogger, Logger} from './logger';
import {Octokit} from '@octokit/rest';
import {GitHubContext, Credentials, Parameters} from './types';
import {runGitHub} from './handle-github';
import {makeCLIChanges} from './get-changes';
import * as yargs from 'yargs';
import {execSync} from 'child_process';

interface GitHubSuggester {
  accessToken: string;
  writePermissions: boolean;
  octokit: Octokit;
  log: Logger;
  gitHubContext: GitHubContext;
  run(): void;
}

class CLISuggester implements GitHubSuggester {
  static readonly outputDir = 'out';
  accessToken!: string;
  writePermissions: boolean;
  octokit!: Octokit;
  log!: Logger;
  gitHubContext!: GitHubContext;

  constructor(params: Parameters) {
    this.writePermissions = params.writePermissions || false;
    this.setupLogger(params.logger);
    this.setupAuthentication();
    this.setupGitHubContext();
    this.log.info('done setup');
  }

  private static getOwner() {
    const gitHubURL: string = execSync(
      'git config --get remote.origin.url'
    ).toString();
    return gitHubURL.split('/')[3];
  }

  private setupLogger(logger?: Logger) {
    this.log = logger || defaultLogger;
  }

  private setupAuthentication() {
    const token: Credentials.ACCESS_TOKEN = process.env[
      Credentials.ACCESS_TOKEN
    ] as Credentials.ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        `process.env[\"${Credentials.ACCESS_TOKEN}\"] is null or undefined`
      );
    }
    this.accessToken = token;
    this.octokit = new Octokit({
      auth: token,
    });
  }

  private async setupGitHubContext() {
    yargs
      .option('commitMessage', {
        alias: 'm',
        type: 'string',
        describe: 'The message for a commit',
        default: 'Third-party change',
      })
      .option('repository', {
        alias: 'r',
        type: 'string',
        describe: 'The repository name',
        default: execSync(
          'basename `git rev-parse --show-toplevel`'
        ).toString(),
      })
      .option('title', {
        alias: 't',
        type: 'string',
        describe: 'The PR title',
        default: 'Third-party suggestion',
      })
      .option('branch', {
        alias: 'b',
        type: 'string',
        describe: 'The working branch name',
        default: 'Third-party',
      })
      .option('owner', {
        alias: 'o',
        type: 'string',
        describe: 'The owner/organization of the repo',
        default: CLISuggester.getOwner(),
      })
      .option('description', {
        alias: 'd',
        type: 'string',
        describe: 'The description of a PR',
        default: 'Third-party suggestions',
      })
      .option('write', {
        alias: 'w',
        type: 'boolean',
        describe: 'The write permissions to a repo',
        default: true,
      })
      .option('login', {
        alias: 'l',
        type: 'string',
        describe: 'The username of the worker',
      });
    this.gitHubContext = {
      branchName: yargs.argv.branch as string,
      mainOwner: yargs.argv.owner as string,
      mainRepo: yargs.argv.repository as string,
      prDescription: yargs.argv.description as string,
      prTitle: yargs.argv.title as string,
      writePermissions: yargs.argv.write as boolean,
      workerOwner: yargs.argv.login as string,
    };
  }

  async run() {
    const changes = await makeCLIChanges(this);
    await runGitHub(this, changes);
  }
}

// TODO implement ActionSuggester

// TODO implement ProbotSuggester

type Suggester = CLISuggester;

export {CLISuggester, Suggester};
