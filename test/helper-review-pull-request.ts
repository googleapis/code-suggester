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

import {assert, expect} from 'chai';
import {describe, it, before} from 'mocha';
import {octokit, setup} from './util';
import {RepoDomain, RawContent, Patch, Hunk} from '../src/types';
import {Octokit} from '@octokit/rest';
import * as proxyquire from 'proxyquire';
before(() => {
  setup();
});

describe('reviewPullRequest', () => {
  const rawChanges: Map<string, RawContent> = new Map();
  rawChanges.set('src/index.ts', {
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
    const validFileLines = new Map();
    const filePatches = new Map();
    const outOfScopeSuggestions = new Map();
    const invalidFiles = [
      'invalid-file1.txt',
      'invalid-file2.txt',
      'invalid-file3.txt',
    ];
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler': {
          getPullRequestScope: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testRemote.owner).equals(owner);
            expect(testOctokit).equals(octokit);
            expect(testRemote.repo).equals(repo);
            expect(testPullNumber).equals(pullNumber);
            expect(testPageSize).equals(pageSize);
            numMockedHelpersCalled += 1;
            return {invalidFiles, validFileLines};
          },
        },
        './raw-patch-handler': {
          getSuggestionPatches: (
            testRawChanges: Map<string, RawContent>,
            testInvalidFiles: string[],
            testValidFileLines: Map<string, Range[]>
          ) => {
            expect(testRawChanges).equals(rawChanges);
            expect(testInvalidFiles).equals(invalidFiles);
            expect(testValidFileLines).equals(validFileLines);
            numMockedHelpersCalled += 1;
            return {filePatches, outOfScopeSuggestions};
          },
        },
        './make-review-handler': {
          makeInlineSuggestions: (
            testOctokit: Octokit,
            testFilePatches: Map<string, Patch[]>,
            testoutOfScopeSuggestions: Map<string, Hunk[]>,
            testRemote: RepoDomain,
            testPullNumber: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testFilePatches).equals(filePatches);
            expect(testRemote).equals(remote);
            expect(testoutOfScopeSuggestions).equals(outOfScopeSuggestions);
            expect(testPullNumber).equals(pullNumber);
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
      rawChanges
    );
    expect(numMockedHelpersCalled).equals(3);
  });

  it('Executes patch handler without error when valid patch is passed', async () => {
    let numMockedHelpersCalled = 0;
    const validFileLines = new Map();
    const invalidFiles = [
      'invalid-file1.txt',
      'invalid-file2.txt',
      'invalid-file3.txt',
    ];
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler': {
          getPullRequestScope: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testRemote.owner).equals(owner);
            expect(testOctokit).equals(octokit);
            expect(testRemote.repo).equals(repo);
            expect(testPullNumber).equals(pullNumber);
            expect(testPageSize).equals(pageSize);
            numMockedHelpersCalled += 1;
            return {invalidFiles, validFileLines};
          },
        },
        './make-review-handler': {
          makeInlineSuggestions: (
            testOctokit: Octokit,
            testFilePatches: Map<string, Patch[]>,
            testoutOfScopeSuggestions: Map<string, Hunk[]>,
            testRemote: RepoDomain,
            testPullNumber: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testRemote).equals(remote);
            expect(testPullNumber).equals(pullNumber);
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
      rawChanges
    );
    expect(numMockedHelpersCalled).equals(2);
  });

  it('Passes up the error message when getPullRequestScope helper fails', async () => {
    let numMockedHelpersCalled = 0;
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler': {
          getPullRequestScope: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testRemote.owner).equals(owner);
            expect(testOctokit).equals(octokit);
            expect(testRemote.repo).equals(repo);
            expect(testPullNumber).equals(pullNumber);
            expect(testPageSize).equals(pageSize);
            numMockedHelpersCalled += 1;
            throw new Error('getPullRequestScope failed');
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
        rawChanges
      );
      assert.ok(false);
    } catch (err) {
      expect(numMockedHelpersCalled).equals(1);
      expect(err.message).equals('getPullRequestScope failed');
    }
  });

  it('Passes up the error message when getSuggestionPatches helper fails', async () => {
    let numMockedHelpersCalled = 0;
    const validFileLines = new Map();
    const invalidFiles = [
      'invalid-file1.txt',
      'invalid-file2.txt',
      'invalid-file3.txt',
    ];
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler': {
          getPullRequestScope: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testRemote.owner).equals(owner);
            expect(testOctokit).equals(octokit);
            expect(testRemote.repo).equals(repo);
            expect(testPullNumber).equals(pullNumber);
            expect(testPageSize).equals(pageSize);
            numMockedHelpersCalled += 1;
            return {invalidFiles, validFileLines};
          },
        },
        './raw-patch-handler': {
          getSuggestionPatches: (
            testRawChanges: Map<string, RawContent>,
            testInvalidFiles: string[],
            testValidFileLines: Map<string, Range[]>
          ) => {
            expect(testRawChanges).equals(rawChanges);
            expect(testInvalidFiles).equals(invalidFiles);
            expect(testValidFileLines).equals(validFileLines);
            numMockedHelpersCalled += 1;
            throw new Error('getSuggestionPatches failed');
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
        rawChanges
      );
      assert.ok(false);
    } catch (err) {
      expect(numMockedHelpersCalled).equals(2);
      expect(err.message).equals('getSuggestionPatches failed');
    }
  });

  it('Passes up the error message when get makeInlineSuggestions helper fails', async () => {
    let numMockedHelpersCalled = 0;
    const validFileLines = new Map();
    const filePatches = new Map();
    const outOfScopeSuggestions = new Map();
    const invalidFiles = [
      'invalid-file1.txt',
      'invalid-file2.txt',
      'invalid-file3.txt',
    ];
    const stubMakePr = proxyquire.noCallThru()(
      '../src/github-handler/comment-handler',
      {
        './get-hunk-scope-handler': {
          getPullRequestScope: (
            testOctokit: Octokit,
            testRemote: RepoDomain,
            testPullNumber: number,
            testPageSize: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testRemote.owner).equals(owner);
            expect(testOctokit).equals(octokit);
            expect(testRemote.repo).equals(repo);
            expect(testPullNumber).equals(pullNumber);
            expect(testPageSize).equals(pageSize);
            numMockedHelpersCalled += 1;
            return {invalidFiles, validFileLines};
          },
        },
        './raw-patch-handler': {
          getSuggestionPatches: (
            testRawChanges: Map<string, RawContent>,
            testInvalidFiles: string[],
            testValidFileLines: Map<string, Range[]>
          ) => {
            expect(testRawChanges).equals(rawChanges);
            expect(testInvalidFiles).equals(invalidFiles);
            expect(testValidFileLines).equals(validFileLines);
            numMockedHelpersCalled += 1;
            return {filePatches, outOfScopeSuggestions};
          },
        },
        './make-review-handler': {
          makeInlineSuggestions: (
            testOctokit: Octokit,
            testFilePatches: Map<string, Patch[]>,
            testoutOfScopeSuggestions: Map<string, Hunk[]>,
            testRemote: RepoDomain,
            testPullNumber: number
          ) => {
            expect(testOctokit).equals(octokit);
            expect(testFilePatches).equals(filePatches);
            expect(testRemote).equals(remote);
            expect(testoutOfScopeSuggestions).equals(outOfScopeSuggestions);
            expect(testPullNumber).equals(pullNumber);
            numMockedHelpersCalled += 1;
            throw new Error('makeInlineSuggestions failed');
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
        rawChanges
      );
      assert.ok(false);
    } catch (err) {
      expect(numMockedHelpersCalled).equals(3);
      expect(err.message).equals('makeInlineSuggestions failed');
    }
  });
});
