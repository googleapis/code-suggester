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

/**
 * The domain of a repository
 */
interface RepoDomain {
  repo: string;
  owner: string;
}

/**
 * The user parameter for GitHub data needed for creating a PR
 */
interface GitHubContextParam {
  // the owner of the target fork repository
  upstreamOwner: string;
  // the name of the target fork repository
  upstreamRepo: string;
  // the name of the branch to push changes to
  originBranch?: string;
  // the description of the pull request
  prDescription?: string;
  // the title of the pull request
  prTitle?: string;
}

/**
 * GitHub data needed for creating a PR
 */
interface GitHubContext {
  // the owner of the target fork repository
  upstreamOwner: string;
  // the name of the target fork repository
  upstreamRepo: string;
  // the name of the branch to push changes to
  originBranch: string;
  // the description of the pull request
  prDescription: string;
  // the title of the pull request
  prTitle: string;
}

export {
  Files,
  GitHubContextParam,
  GitHubContext,
  Level,
  Logger,
  Octokit,
  RepoDomain,
};
