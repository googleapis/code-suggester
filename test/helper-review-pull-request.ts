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
import {RepoDomain, FileDiffContent, Hunk} from '../src/types';
import {Octokit} from '@octokit/rest';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as reviewPullRequestHandler from '../src/github/review-pull-request';
import * as hunkHandler from '../src/utils/hunk-utils';

const fixturePath = 'test/fixtures/diffs';

const sandbox = sinon.createSandbox();

before(() => {
  setup();
});

describe('createPullRequestReview', () => {
  const diffContents: Map<string, FileDiffContent> = new Map();
  diffContents.set('src/index.ts', {
    newContent: 'hello world',
    oldContent: 'hello',
  });
  const pageSize = 3;
  const pullNumber = 100;
  const repo = 'helper-comment-review-repo';
  const owner = 'helper-comment-review-owner';
  const remote: RepoDomain = {repo, owner};

  let getPullRequestHunksStub: sinon.SinonStub;
  let makeInlineSuggestionsStub: sinon.SinonStub;

  beforeEach(() => {
    getPullRequestHunksStub = sandbox.stub(
      reviewPullRequestHandler,
      'getPullRequestHunks'
    );
    makeInlineSuggestionsStub = sandbox.stub(
      reviewPullRequestHandler,
      'makeInlineSuggestions'
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Succeeds when all values are passed as expected', async () => {
    const validFileHunks = new Map();
    const invalidFileHunks = new Map();
    const suggestionHunks = new Map();
    getPullRequestHunksStub.resolves(validFileHunks);
    const getRawSuggestionHunksStub = sandbox.stub(
      hunkHandler,
      'getRawSuggestionHunks'
    );
    getRawSuggestionHunksStub.returns(suggestionHunks);
    const partitionHunksStub = sandbox.stub(
      hunkHandler,
      'partitionSuggestedHunksByScope'
    );
    partitionHunksStub.returns({
      validHunks: validFileHunks,
      invalidHunks: invalidFileHunks,
    });
    makeInlineSuggestionsStub.resolves(234);

    await reviewPullRequestHandler.createPullRequestReview(
      octokit,
      remote,
      pullNumber,
      pageSize,
      diffContents
    );

    sinon.assert.calledWith(
      getPullRequestHunksStub,
      sinon.match.instanceOf(Octokit),
      {
        owner,
        repo,
      },
      pullNumber,
      pageSize
    );
    sinon.assert.calledWith(getRawSuggestionHunksStub, diffContents);
    sinon.assert.calledWith(
      partitionHunksStub,
      validFileHunks,
      suggestionHunks
    );
    sinon.assert.calledWith(
      makeInlineSuggestionsStub,
      sinon.match.instanceOf(Octokit),
      validFileHunks,
      invalidFileHunks,
      remote,
      pullNumber
    );
  });

  it('Succeeds when diff string provided', async () => {
    const diffString = readFileSync(
      resolve(fixturePath, 'many-to-many.diff')
    ).toString();
    const validFileHunks = new Map<string, Hunk[]>();
    validFileHunks.set('cloudbuild.yaml', [
      {
        newStart: 0,
        newEnd: 10,
        oldStart: 0,
        oldEnd: 10,
        newContent: [],
      },
    ]);

    getPullRequestHunksStub.resolves(validFileHunks);
    makeInlineSuggestionsStub.resolves(234);

    await reviewPullRequestHandler.createPullRequestReview(
      octokit,
      remote,
      pullNumber,
      pageSize,
      diffString
    );

    sinon.assert.calledWith(
      getPullRequestHunksStub,
      sinon.match.instanceOf(Octokit),
      {owner, repo},
      pullNumber,
      pageSize
    );
    sinon.assert.calledWith(
      makeInlineSuggestionsStub,
      sinon.match.instanceOf(Octokit),
      sinon.match.map,
      sinon.match.map,
      remote,
      pullNumber
    );
  });

  it('Passes up the error message when getPullRequestHunks helper fails', async () => {
    const error = new Error('getPullRequestHunks failed');
    getPullRequestHunksStub.rejects(error);

    await assert.rejects(
      reviewPullRequestHandler.createPullRequestReview(
        octokit,
        remote,
        pullNumber,
        pageSize,
        diffContents
      ),
      error
    );
  });
});
