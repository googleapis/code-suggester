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

import {GitHubPr, GitHubPrUserOptions} from './types';

const defaultNameNoSpaces = 'code-suggestions';
const defaultDescription = 'code suggestions';
const defaultMessage = 'chore: code suggestions';
const defaultPrimaryBranch = 'master';

/**
 * Add defaults to GitHub PR data
 * @param {GitHubPrUserOptions} options the user-provided github context
 * @returns {GitHubPr} git hub context with defaults applied
 */
function addPrOptionDefaults(options: GitHubPrUserOptions): GitHubPr {
  const gitHubPr: GitHubPr = {
    upstreamOwner: options.upstreamOwner,
    upstreamRepo: options.upstreamRepo,
    branch: options.branch || defaultNameNoSpaces,
    description: options.description || defaultDescription,
    title: options.title || defaultMessage,
    force: options.force || false,
    message: options.message || defaultMessage,
    primary: options.primary || defaultPrimaryBranch,
    maintainersCanModify: options.maintainersCanModify === false ? false : true,
  };
  return gitHubPr;
}

export {addPrOptionDefaults};
