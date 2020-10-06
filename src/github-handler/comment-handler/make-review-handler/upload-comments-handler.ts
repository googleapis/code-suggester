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
import {Hunk, RepoDomain} from '../../../types';
import {logger} from '../../../logger';
import {buildSummaryComment} from './message-handler';

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

interface SingleLineComment {
  body: string;
  path: string;
  line: number;
  side: 'RIGHT' | 'LEFT';
}

type Comment = SingleLineComment | MultilineComment;

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
  suggestions: Map<string, Hunk[]>
): Comment[] {
  const fileComments: Comment[] = [];
  suggestions.forEach((hunks: Hunk[], fileName: string) => {
    hunks.forEach(hunk => {
      const newContent = hunk.newContent.join('\n');
      if (hunk.newStart === hunk.newEnd) {
        const singleComment: SingleLineComment = {
          path: fileName,
          body: `\`\`\`suggestion\n${newContent}\n\`\`\``,
          line: hunk.newEnd,
          side: 'RIGHT',
        };
        fileComments.push(singleComment);
      } else {
        const comment: MultilineComment = {
          path: fileName,
          body: `\`\`\`suggestion\n${newContent}\n\`\`\``,
          start_line: hunk.newStart,
          line: hunk.newEnd,
          side: 'RIGHT',
          start_side: 'RIGHT',
        };
        fileComments.push(comment);
      }
    });
  });
  return fileComments;
}

/**
 * Make a request to GitHub to make review comments
 * @param octokit an authenticated octokit instance
 * @param suggestions code suggestions patches
 * @param remote the repository domain
 * @param pullNumber the pull request number to make a review on
 */
export async function makeInlineSuggestions(
  octokit: Octokit,
  suggestions: Map<string, Hunk[]>,
  outOfScopeSuggestions: Map<string, Hunk[]>,
  remote: RepoDomain,
  pullNumber: number
): Promise<number | null> {
  const comments = buildReviewComments(suggestions);
  if (!comments.length) {
    logger.info('No valid suggestions to make');
  }
  if (!comments.length && !outOfScopeSuggestions.size) {
    logger.info('No suggestions were generated. Exiting...');
    return null;
  }
  const summaryComment = buildSummaryComment(outOfScopeSuggestions);
  if (summaryComment) {
    logger.warn('Some suggestions could not be made');
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
  const reviewNumber = (
    await octokit.pulls.createReview({
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      commit_id: headSha,
      event: 'COMMENT',
      body: summaryComment,
      headers: {accept: COMFORT_PREVIEW_HEADER},
      // Octokit type definitions doesn't support mulitiline comments, but the GitHub API does
      comments: (comments as unknown) as PullsCreateReviewParamsComments[],
    })
  ).data.id;
  logger.info(`Successfully created a review on pull request: ${pullNumber}.`);
  return reviewNumber;
}
