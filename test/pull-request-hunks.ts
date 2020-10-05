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

import {expect} from 'chai';
import {describe, it, before, afterEach} from 'mocha';
import {setup} from './util';
import * as sinon from 'sinon';
import {Octokit} from '@octokit/rest';
import {getPullRequestHunks} from '../src/github-handler/comment-handler/get-hunk-scope-handler/remote-patch-ranges-handler';

before(() => {
  setup();
});

describe('getPullRequestHunks', () => {
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const pullNumber = 10;
  const pageSize = 80;
  const octokit = new Octokit({});
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('Returns the correct values when octokit and patch text parsing function execute properly', async () => {
    // setup
    const patch = `@@ -1,2 +1,5 @@
 Hello world
-!
+Goodbye World
+gOodBYE world
+
+Goodbye World`;
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
          patch: patch,
        },
      ],
    };
    const stub = sandbox
      .stub(octokit.pulls, 'listFiles')
      .resolves(listFilesOfPRResult);

    // tests
    const pullRequestHunks = await getPullRequestHunks(
      octokit,
      upstream,
      pullNumber,
      pageSize
    );
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: upstream.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    });
    const hunks = pullRequestHunks.get('Readme.md');
    expect(hunks).not.equals(null);
    expect(hunks!.length).equals(1);
    expect(hunks![0].newStart).equals(2);
    expect(hunks![0].newEnd).equals(5);
  });

  it('Passes up the error when a sub-method fails', async () => {
    // setup
    const errorMsg = 'Test error for list files';
    sandbox.stub(octokit.pulls, 'listFiles').rejects(new Error(errorMsg));

    // tests
    try {
      await getPullRequestHunks(octokit, upstream, pullNumber, pageSize);
      expect.fail(
        'The getPullRequestHunks function should have failed because Octokit failed.'
      );
    } catch (err) {
      expect(err.message).equals(errorMsg);
    }
  });
});
