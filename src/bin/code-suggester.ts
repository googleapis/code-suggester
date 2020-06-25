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

import {logger as defaultLogger, Logger} from '../logger';
import {Octokit} from '@octokit/rest';
import {Credentials, Parameters} from '../types';
import {runGitHub} from '../handle-github';

function initOctokit(): Octokit {
  const token: Credentials.ACCESS_TOKEN = process.env[
    Credentials.ACCESS_TOKEN
  ] as Credentials.ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      `process.env[\"${Credentials.ACCESS_TOKEN}\"] is null or undefined`
    );
  }
  return new Octokit({auth: token});
}

async function suggest(params: Parameters) {
  if (!params.logger) {
    params.logger = defaultLogger;
  }
  const octokit: Octokit = initOctokit();
  await runGitHub(params.changes, params.gitHubContext, params.logger, octokit);
}

export {suggest};
