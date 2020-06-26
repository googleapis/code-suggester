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
import {proposeChanges} from '../handle-github';
import {Files, GitHubContext} from '../types';

const ACCESS_TOKEN = 'ACCESS_TOKEN';

function initOctokit(): Octokit {
  const token = process.env[ACCESS_TOKEN];
  if (!token) {
    throw new Error(`process.env[\"${ACCESS_TOKEN}\"] is null or undefined`);
  }
  return new Octokit({auth: token});
}

async function suggest(
  changes: Files,
  gitHubContext: GitHubContext,
  logger: Logger
) {
  if (!logger) {
    logger = defaultLogger;
  }
  const octokit: Octokit = initOctokit();
  await proposeChanges(changes, gitHubContext, logger, octokit);
}

export {suggest};
