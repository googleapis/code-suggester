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
import {describe, it, before, afterEach} from 'mocha';
import {setup} from './util';
import * as sinon from 'sinon';
import {getCurrentPullRequestPatches} from '../src/github-handler/comment-handler/get-hunk-scope-handler/remote-patch-ranges-handler';
import {Octokit} from '@octokit/rest';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import {logger} from '../src/logger';

const octokit = new Octokit({});
type ListFilesResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.pulls.listFiles
>;

before(() => {
  setup();
});

describe('getCurrentPullRequestPatches', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const pullNumber = 10;
  const pageSize = 80;

  it('Calls Octokit with the correct values', async () => {
    // setup
    const listFilesOfPRResult: ListFilesResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch:
            '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World',
        },
      ],
    };
    const stub = sandbox
      .stub(octokit.pulls, 'listFiles')
      .resolves(listFilesOfPRResult);

    // tests
    await getCurrentPullRequestPatches(octokit, upstream, pullNumber, pageSize);
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: upstream.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    });
  });
  it('Returns all the valid patches', async () => {
    // setup
    const listFilesOfPRResult: ListFilesResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch:
            '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World',
        },
        {
          sha: '8b137891791fe96927ad78e64b0aad7bded08bdc',
          filename: 'foo/foo.txt',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/foo/foo.txt',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/foo/foo.txt',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/foo/foo.txt?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch: '@@ -1 +1 @@\n-Hello foo\n+',
        },
        {
          sha: '3b18e512dba79e4c8300dd08aeb37f8e728b8dad',
          filename: 'helloworld.txt',
          status: 'removed',
          additions: 0,
          deletions: 1,
          changes: 1,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/f5da827a725a701302da7db2da16b1678f52fdcc/helloworld.txt',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/f5da827a725a701302da7db2da16b1678f52fdcc/helloworld.txt',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/helloworld.txt?ref=f5da827a725a701302da7db2da16b1678f52fdcc',
          patch: '@@ -1 +0,0 @@\n-hello world',
        },
      ],
    };
    sandbox.stub(octokit.pulls, 'listFiles').resolves(listFilesOfPRResult);

    // tests
    const {patches, filesMissingPatch} = await getCurrentPullRequestPatches(
      octokit,
      upstream,
      pullNumber,
      pageSize
    );
    assert.strictEqual(patches.size, 3);
    assert.strictEqual(
      patches.get(listFilesOfPRResult.data[0].filename),
      '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World'
    );
    assert.strictEqual(
      patches.get(listFilesOfPRResult.data[1].filename),
      '@@ -1 +1 @@\n-Hello foo\n+'
    );
    assert.strictEqual(
      patches.get(listFilesOfPRResult.data[2].filename),
      '@@ -1 +0,0 @@\n-hello world'
    );
    assert.strictEqual(filesMissingPatch.length, 0);
  });
  it('Passes the error message up from octokit when octokit fails', async () => {
    // setup
    const error = new Error('Error message');
    sandbox.stub(octokit.pulls, 'listFiles').rejects(error);
    await assert.rejects(
      getCurrentPullRequestPatches(octokit, upstream, pullNumber, pageSize),
      error
    );
  });
  it('Throws when there is no list file data returned from octokit', async () => {
    // setup
    const listFilesOfPRResult: ListFilesResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [],
    };
    sandbox.stub(octokit.pulls, 'listFiles').resolves(listFilesOfPRResult);
    await assert.rejects(
      getCurrentPullRequestPatches(octokit, upstream, pullNumber, pageSize),
      /Empty Pull Request/
    );
  });
  it('Does not error when there is list file data but no patch data', async () => {
    // setup
    const listFilesOfPRResult = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
        },
      ],
    };

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    // these are real results from calling listFiles API and are a valid GitHub return type, but octokit type definition says otherwise
    // cannot force another type cast since the GitHub API return types are not importable
    // unknown type cast not allowed
    const stub = sandbox
      .stub(logger, 'warn')
      .resolves(listFilesOfPRResult as any);
    sandbox
      .stub(octokit.pulls, 'listFiles')
      .resolves(listFilesOfPRResult as any);

    // tests
    const {filesMissingPatch} = await getCurrentPullRequestPatches(
      octokit,
      upstream,
      pullNumber,
      pageSize
    );
    sandbox.assert.called(stub);
    assert.strictEqual(filesMissingPatch.length, 1);
    assert.strictEqual(filesMissingPatch[0], 'Readme.md');
  });
});
