// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable node/no-unsupported-features/node-builtins */

import * as assert from 'assert';
import {describe, it, before} from 'mocha';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {CreateReviewComment, FileDiffContent} from '../src/types';
import {Octokit} from '@octokit/rest';
import * as reviewPullRequestHandler from '../src/github/review-pull-request';
import {reviewPullRequest} from '../src/index';

const sandbox = sinon.createSandbox();

before(() => {
  setup();
});

/* eslint-disable  @typescript-eslint/no-unused-vars */
describe('reviewPullRequest', () => {
  const diffContents: Map<string, FileDiffContent> = new Map();
  diffContents.set('src/index.ts', {
    newContent: 'hello world',
    oldContent: 'hello',
  });
  const repo = 'main-comment-review-repo';
  const owner = 'main-comment-review-owner';
  const pullNumber = 1232143242;
  const pageSize = 321;
  const options: CreateReviewComment = {
    repo,
    owner,
    pullNumber,
    pageSize,
  };
  let reviewPullRequestStub: sinon.SinonStub;

  beforeEach(() => {
    reviewPullRequestStub = sandbox.stub(
      reviewPullRequestHandler,
      'createPullRequestReview'
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Does not error on success', async () => {
    reviewPullRequestStub.resolves();
    await reviewPullRequest(octokit, diffContents, options);
    sinon.assert.calledOnceWithMatch(
      reviewPullRequestStub,
      sinon.match.instanceOf(Octokit),
      {
        owner,
        repo,
      },
      pullNumber,
      pageSize,
      diffContents
    );
  });

  it('Does not call the github handlers when there are no changes to make because user passed an empty changeset', async () => {
    await reviewPullRequest(octokit, new Map(), options);
    sinon.assert.notCalled(reviewPullRequestStub);
  });

  it('Passes up the error message when the create review comment helper fails', async () => {
    const error = new Error('Review pull request helper failed');
    reviewPullRequestStub.rejects(error);
    await assert.rejects(
      reviewPullRequest(octokit, diffContents, options),
      error
    );
  });
});
