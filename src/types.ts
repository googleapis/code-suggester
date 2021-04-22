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

export type FileMode = '100644' | '100755' | '040000' | '160000' | '120000';

/**
 * GitHub definition of tree
 */
export interface TreeObject {
  path: string;
  mode: FileMode;
  type: 'blob' | 'tree' | 'commit';
  sha?: string | null;
  content?: string;
}

/**
 * The content and the mode of a file.
 * Default file mode is a text file which has code '100644'.
 * If `content` is not null, then `content` must be the entire file content.
 * See https://developer.github.com/v3/git/trees/#tree-object for details on mode.
 */
export class FileData {
  readonly mode: FileMode;
  readonly content: string | null;
  constructor(content: string | null, mode: FileMode = '100644') {
    this.mode = mode;
    this.content = content;
  }
}

/**
 * The map of a path to its content data.
 * The content must be the entire file content.
 */
export type Changes = Map<string, FileData>;

/**
 * The domain of a repository
 */
export interface RepoDomain {
  repo: string;
  owner: string;
}

/**
 * The domain for a branch
 */
export interface BranchDomain extends RepoDomain {
  branch: string;
}

/**
 * The descriptive properties for any entity
 */
export interface Description {
  title: string;
  body: string;
}

/**
 * The user options for creating GitHub PRs
 */
export interface CreatePullRequestUserOptions {
  // the owner of the target fork repository
  upstreamOwner: string;
  // the name of the target fork repository
  upstreamRepo: string;
  // The message of any commits made.
  message: string;
  // The description of the pull request.
  description: string;
  // The title of the pull request.
  title: string;
  // the name of the branch to push changes to. Default is 'code-suggestions'. (optional)
  branch?: string;
  // Whether or not to force branch reference updates. Default is false. (optional)
  force?: boolean;
  // Should a fork be used when creating pull request
  fork?: boolean;
  // Primary upstream branch to open PRs against. Default is 'master' (optional)
  primary?: string;
  // Whether or not maintainers can modify the PR. Default is true. (optional)
  maintainersCanModify?: boolean;
  // The list of labels to apply to the newly created PR. Default is empty. (optional)
  labels?: string[];
  // Number of times to retry if the request fails.  Defaults to 5.
  retry?: number;
  // Create a DRAFT pull request.
  draft?: boolean;
}

/**
 * GitHub data needed for creating a PR
 */
export interface CreatePullRequest {
  // the owner of the target fork repository
  upstreamOwner: string;
  // the name of the target fork repository
  upstreamRepo: string;
  // The message of any commits made.
  message: string;
  // The description of the pull request.
  description: string;
  // The title of the pull request
  title: string;
  // the name of the branch to push changes to.
  branch: string;
  // Whether or not to force branch reference updates.
  force: boolean;
  // Primary upstream branch to open PRs against.
  primary: string;
  // Whether or not maintainers can modify the PR.
  maintainersCanModify: boolean;
}

/**
 * The user options for creating GitHub PR review comment
 */
export interface CreateReviewCommentUserOptions {
  // the owner of the target fork repository
  owner: string;
  // the name of the target fork repository
  repo: string;
  // The pull request number
  pullNumber: number;
  // The number of files to return per pull request list files query. Used when getting data on the remote PR's files.
  pageSize?: number;
}

/**
 * The user options for creating GitHub PR review comment
 */
export interface CreateReviewComment {
  // the owner of the target fork repository
  owner: string;
  // the name of the target fork repository
  repo: string;
  // The pull request number
  pullNumber: number;
  // The number of files to return per pull request list files query. Used when getting data on the remote PR's files.
  pageSize: number;
}

export class PatchSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PatchSyntaxError';
  }
}

/**
 * The file content of the original content and the patched content
 */
export interface FileDiffContent {
  readonly oldContent: string;
  readonly newContent: string;
}

export interface Hunk {
  readonly oldStart: number;
  readonly oldEnd: number;
  readonly newStart: number;
  readonly newEnd: number;
  readonly newContent: string[];
  readonly previousLine?: string;
  readonly nextLine?: string;
}
