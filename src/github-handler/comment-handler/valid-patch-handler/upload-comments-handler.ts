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

import {Octokit} from '@octokit/rest';
import {Patch, RepoDomain} from '../../../types';
import {logger} from '../../../logger';

const COMFORT_PREVIEW_HEADER =
  'application/vnd.github.comfort-fade-preview+json';

/**
 * Multiline comment GitHub API parameters
 * For more information see
 * https://developer.github.com/v3/pulls/comments/#create-a-review-comment-for-a-pull-request
 */
interface MultilineComment {
  body: string;
  path: string;
  start_line: number;
  line: number;
  side: 'RIGHT' | 'LEFT';
  start_side: 'RIGHT' | 'LEFT';
}

/**
 * GitHub-defined type. The Octokit library/docs are probably behind since create review already
 * accept multi-line code comments. However, the API does not reflect that.
 */
export type PullsCreateReviewParamsComments = {
  path: string;
  position: number;
  body: string;
};

/**
 * Convert the patch suggestions into GitHub parameter objects.
 * Use this to generate review comments
 * For information see:
 * https://developer.github.com/v3/pulls/comments/#create-a-review-comment-for-a-pull-request
 * @param suggestions
 */
export function buildReviewComments(
  suggestions: Map<string, Patch[]>
): MultilineComment[] {
  const fileComments: MultilineComment[] = [];
  suggestions.forEach((patches: Patch[], fileName: string) => {
    patches.forEach(patch => {
      const comment: MultilineComment = {
        path: fileName,
        body: `\`\`\`suggestion\n${patch.newContent}\`\`\``,
        start_line: patch.start,
        line: patch.end,
        side: 'RIGHT',
        start_side: 'RIGHT',
      };
      fileComments.push(comment);
    });
  });
  return fileComments;
}

/**
 * Make a request to GitHub to make review comments
 * @param octokit
 * @param suggestions
 * @param remote
 * @param pullNumber
 */
export async function makeInlineSuggestion(
  octokit: Octokit,
  suggestions: Map<string, Patch[]>,
  remote: RepoDomain,
  pullNumber: number
): Promise<void> {
  if (!suggestions.size) {
    logger.info('No suggestions to make. Exiting...');
    return;
  }
  // apply the suggestions to the latest sha
  // the latest Pull Request hunk range includes
  // all previous commit valid hunk ranges
  const headSha = (
    await octokit.pulls.get({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
    })
  ).data.head.sha;
  const comments = buildReviewComments(suggestions);
  if (!comments.length) {
    logger.info('No suggestions to make. Exiting...');
    return;
  }
  await octokit.pulls.createReview({
    owner: remote.owner,
    repo: remote.repo,
    pull_number: pullNumber,
    commit_id: headSha,
    event: 'COMMENT',
    headers: {accept: COMFORT_PREVIEW_HEADER},
    // Octokit type definitions doesn't support mulitiline comments, but the GitHub API does
    comments: (comments as unknown) as PullsCreateReviewParamsComments[],
  });
}
