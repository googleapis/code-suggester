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

import {Level, Logger} from '../logger';
import {Octokit} from '@octokit/rest';

// a flat object of the path of the file as the key, and the text contents as a value
interface Files {
  [index: string]: string;
}

// Env variable names
enum Credentials {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
}

/**
 * GitHub data needed for creating a PR
 */
interface GitHubContext {
  prDescription: string;
  prTitle: string;
  mainRepo: string;
  mainOwner: string;
  writePermissions: boolean;
  branchName: string;
  workerRepo?: string;
  workerOwner?: string;
}

interface Parameters {
  changes: Files;
  gitHubContext: GitHubContext;
  octokit: Octokit;
  logger?: Logger;
}

export {Credentials, Files, GitHubContext, Level, Logger, Parameters};
