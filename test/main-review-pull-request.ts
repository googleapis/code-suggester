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
import {CreateReviewComment, RepoDomain, FileDiffContent} from '../src/types';
import {Octokit} from '@octokit/rest';
import * as proxyquire from 'proxyquire';
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

  it('Does not error on success', async () => {
    let numMockedHelpersCalled = 0;
    const stubHelperHandlers = {
      reviewPullRequest: (
        octokit: Octokit,
        remote: RepoDomain,
        testPullNumber: number,
        testPPageSize: number,
        testDiffContents: Map<string, FileDiffContent>
      ) => {
        assert.strictEqual(remote.owner, owner);
        assert.strictEqual(remote.repo, repo);
        assert.strictEqual(testPullNumber, pullNumber);
        assert.strictEqual(testPPageSize, pageSize);
        assert.strictEqual(testDiffContents, diffContents);
        numMockedHelpersCalled += 1;
      },
    };
    const stubReviewPr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubReviewPr.reviewPullRequest(octokit, diffContents, options);
    assert.strictEqual(numMockedHelpersCalled, 1);
  });

  it('Does not call the github handlers when there are no changes to make because user passed null', async () => {
    const stubHelperHandlers = {
      reviewPullRequest: (
        octokit: Octokit,
        remote: RepoDomain,
        pullNumber: number,
        pageSize: number,
        testDiffContents: Map<string, FileDiffContent>
      ) => {
        assert.fail();
      },
    };
    const stubReviewPr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubReviewPr.reviewPullRequest(octokit, null, options);
  });

  it('Does not call the github handlers when there are no changes to make because user passed undefined', async () => {
    const stubHelperHandlers = {
      reviewPullRequest: (
        octokit: Octokit,
        remote: RepoDomain,
        pullNumber: number,
        pageSize: number,
        testDiffContents: Map<string, FileDiffContent>
      ) => {
        assert.fail();
      },
    };
    const stubReviewPr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubReviewPr.reviewPullRequest(octokit, undefined, options);
  });

  it('Does not call the github handlers when there are no changes to make because user passed an empty changeset', async () => {
    const stubHelperHandlers = {
      reviewPullRequest: (
        octokit: Octokit,
        remote: RepoDomain,
        pullNumber: number,
        pageSize: number,
        testDiffContents: Map<string, FileDiffContent>
      ) => {
        assert.fail();
      },
    };
    const stubReviewPr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubReviewPr.reviewPullRequest(octokit, new Map(), options);
  });

  it('Passes up the error message when the create review comment helper fails', async () => {
    const error = new Error('Review pull request helper failed');
    const stubHelperHandlers = {
      reviewPullRequest: (
        octokit: Octokit,
        remote: RepoDomain,
        pullNumber: number,
        pageSize: number,
        testDiffContents: Map<string, FileDiffContent>
      ) => {
        throw error;
      },
    };
    const stubReviewPr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await assert.rejects(
      stubReviewPr.reviewPullRequest(octokit, diffContents, options),
      error
    );
  });
});
