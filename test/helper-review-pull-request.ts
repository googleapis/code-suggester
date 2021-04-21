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

import * as assert from 'assert';
import {describe, it, before} from 'mocha';
import {octokit, setup} from './util';
import {RepoDomain, FileDiffContent, Hunk} from '../src/types';
import {Octokit} from '@octokit/rest';
import * as proxyquire from 'proxyquire';
import {readFileSync} from 'fs';
import {resolve} from 'path';

const fixturePath = 'test/fixtures/diffs';

before(() => {
  setup();
});

describe('reviewPullRequest', () => {
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

  it('Succeeds when all values are passed as expected', async () => {
    let numMockedHelpersCalled = 0;
    const validFileHunks = new Map();
    const invalidFileHunks = new Map();
    const suggestionHunks = new Map();
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler/remote-patch-ranges-handler': {
          getPullRequestHunks: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testRemote.owner, owner);
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testRemote.repo, repo);
            assert.strictEqual(testPullNumber, pullNumber);
            assert.strictEqual(testPageSize, pageSize);
            numMockedHelpersCalled += 1;
            return validFileHunks;
          },
        },
        './raw-patch-handler/raw-hunk-handler': {
          getRawSuggestionHunks: (
            testDiffContents: Map<string, FileDiffContent>
          ) => {
            assert.strictEqual(testDiffContents, diffContents);
            numMockedHelpersCalled += 1;
            return suggestionHunks;
          },
        },
        './get-hunk-scope-handler/scope-handler': {
          partitionSuggestedHunksByScope: (
            testPullRequestHunks: Map<string, Hunk[]>,
            testSuggestedHunks: Map<string, Hunk[]>
          ) => {
            assert.strictEqual(testPullRequestHunks, validFileHunks);
            assert.strictEqual(testSuggestedHunks, suggestionHunks);
            numMockedHelpersCalled += 1;
            return {validHunks: validFileHunks, invalidHunks: invalidFileHunks};
          },
        },
        './make-review-handler': {
          makeInlineSuggestions: (
            testOctokit: Octokit,
            testValidHunks: Map<string, Hunk[]>,
            testInvalidHunks: Map<string, Hunk[]>,
            testRemote: RepoDomain,
            testPullNumber: number
          ) => {
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testValidHunks, validFileHunks);
            assert.strictEqual(testRemote, remote);
            assert.strictEqual(testInvalidHunks, invalidFileHunks);
            assert.strictEqual(testPullNumber, pullNumber);
            numMockedHelpersCalled += 1;
          },
        },
      }
    );
    await stubMakePr.reviewPullRequest(
      octokit,
      remote,
      pullNumber,
      pageSize,
      diffContents
    );
    assert.strictEqual(numMockedHelpersCalled, 4);
  });

  it('Succeeds when diff string provided', async () => {
    const diffString = readFileSync(
      resolve(fixturePath, 'many-to-many.diff')
    ).toString();
    let numMockedHelpersCalled = 0;
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

    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler/remote-patch-ranges-handler': {
          getPullRequestHunks: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testRemote.owner, owner);
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testRemote.repo, repo);
            assert.strictEqual(testPullNumber, pullNumber);
            assert.strictEqual(testPageSize, pageSize);
            numMockedHelpersCalled += 1;
            return validFileHunks;
          },
        },
        './make-review-handler': {
          makeInlineSuggestions: (
            testOctokit: Octokit,
            testValidHunks: Map<string, Hunk[]>,
            testInvalidHunks: Map<string, Hunk[]>,
            testRemote: RepoDomain,
            testPullNumber: number
          ) => {
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testValidHunks.size, 1);
            assert.strictEqual(testRemote, remote);
            assert.strictEqual(testInvalidHunks.size, 0);
            assert.strictEqual(testPullNumber, pullNumber);
            numMockedHelpersCalled += 1;
          },
        },
      }
    );
    await stubMakePr.reviewPullRequest(
      octokit,
      remote,
      pullNumber,
      pageSize,
      diffString
    );
    assert.strictEqual(numMockedHelpersCalled, 2);
  });

  it('Passes up the error message when getPullRequestHunks helper fails', async () => {
    let numMockedHelpersCalled = 0;
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler/remote-patch-ranges-handler': {
          getPullRequestHunks: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testRemote.owner, owner);
            assert.strictEqual(testOctokit, octokit);
            assert.strictEqual(testRemote.repo, repo);
            assert.strictEqual(testPullNumber, pullNumber);
            assert.strictEqual(testPageSize, pageSize);
            numMockedHelpersCalled += 1;
            throw new Error('getPullRequestHunks failed');
          },
        },
      }
    );
    try {
      await stubMakePr.reviewPullRequest(
        octokit,
        remote,
        pullNumber,
        pageSize,
        diffContents
      );
      assert.ok(false);
    } catch (err) {
      assert.strictEqual(numMockedHelpersCalled, 1);
      assert.strictEqual(err.message, 'getPullRequestHunks failed');
    }
  });
});
