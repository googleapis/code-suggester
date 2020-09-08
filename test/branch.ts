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

import {describe, it, before, afterEach} from 'mocha';
import {assert, expect} from 'chai';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {
  branch,
  getBranchHead,
  createRef,
} from '../src/github-handler/branch-handler';

before(() => {
  setup();
});

describe('Branch', () => {
  const testErrorMessage = 'test-error-message';
  const sandbox = sinon.createSandbox();
  const origin = {owner: 'octocat', repo: 'HelloWorld'};
  const upstream = {owner: 'octocat-upstream', repo: 'HelloWorld-upstream'};
  const branchName = 'test-branch';
  afterEach(() => {
    sandbox.restore();
  });
  it('invokes octokit get branch with correct parameters, invokes octokit correctly, and returns the HEAD sha', async () => {
    // setup
    const branchResponseBody = await import(
      './fixtures/get-branch-response.json'
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    };

    const getBranchStub = sandbox
      .stub(octokit.repos, 'getBranch')
      .resolves(branchResponse);
    // // tests
    const headSHA = await getBranchHead(octokit, origin, 'master');
    expect(headSHA).to.equal(branchResponse.data.commit.sha);
    sandbox.assert.calledOnceWithExactly(getBranchStub, {
      owner: origin.owner,
      repo: origin.repo,
      branch: 'master',
    });
  });

  it('The create branch function returns the primary SHA when create branching is successful', async () => {
    // setup
    const branchResponseBody = await import(
      './fixtures/get-branch-response.json'
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    };
    const createRefResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: {
        ref: 'refs/heads/test-branch',
        node_id: 'MDM6UmVmMjc0NzM5ODIwOnJlZnMvaGVhZHMvVGVzdC1icmFuY2gtNQ==',
        url:
          'https://api.github.com/repos/fake-Owner/HelloWorld/git/refs/heads/Test-branch-5',
        object: {
          sha: 'f826b1caabafdffec3dc45a08e41d7021c68db41',
          type: 'commit',
          url:
            'https://api.github.com/repos/fake-Owner/HelloWorld/git/commits/f826b1caabafdffec3dc45a08e41d7021c68db41',
        },
      },
    };
    const getBranchStub = sandbox
      .stub(octokit.repos, 'getBranch')
      .resolves(branchResponse);
    const getRefError = Error('Not Found');
    Object.assign(getRefError, {status: 404});
    const listBranchStub = sandbox
      .stub(octokit.git, 'getRef')
      .rejects(getRefError);
    const createRefStub = sandbox
      .stub(octokit.git, 'createRef')
      .resolves(createRefResponse);
    // tests
    const sha = await branch(octokit, origin, upstream, branchName, 'master');
    expect(sha).to.equal(branchResponse.data.commit.sha);
    sandbox.assert.calledOnceWithExactly(getBranchStub, {
      owner: upstream.owner,
      repo: upstream.repo,
      branch: 'master',
    });
    sandbox.assert.calledOnceWithExactly(listBranchStub, {
      owner: origin.owner,
      repo: origin.repo,
      ref: `heads/${branchName}`,
    });
    sandbox.assert.calledOnceWithExactly(createRefStub, {
      owner: origin.owner,
      repo: origin.repo,
      ref: `refs/heads/${branchName}`,
      sha: branchResponse.data.commit.sha,
    });
  });

  it('When there is an existing branch the primary HEAD sha is still returned and no new branch is created', async () => {
    // setup
    const branchResponseBody = await import(
      './fixtures/get-branch-response.json'
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    };
    const getRefResponseBody = await import('./fixtures/get-ref-response.json');
    const getRefResponse = {
      headers: {},
      status: 404,
      url: 'http://fake-url.com',
      data: getRefResponseBody,
    };
    const getBranchStub = sandbox
      .stub(octokit.repos, 'getBranch')
      .resolves(branchResponse);
    const listBranchStub = sandbox
      .stub(octokit.git, 'getRef')
      .resolves(getRefResponse);
    const createRefStub = sandbox.stub(octokit.git, 'createRef');
    // tests
    const sha = await branch(
      octokit,
      origin,
      upstream,
      'existing-branch',
      'master'
    );
    expect(sha).to.equal(branchResponse.data.commit.sha);
    sandbox.assert.calledOnceWithExactly(getBranchStub, {
      owner: upstream.owner,
      repo: upstream.repo,
      branch: 'master',
    });
    sandbox.assert.calledOnceWithExactly(listBranchStub, {
      owner: origin.owner,
      repo: origin.repo,
      ref: 'heads/existing-branch',
    });
    sandbox.assert.notCalled(createRefStub);
  });

  it('Branching fails when Octokit get branch fails', async () => {
    sandbox.stub(octokit.repos, 'getBranch').rejects(Error(testErrorMessage));
    try {
      await branch(octokit, origin, upstream, branchName, 'master');
      assert.fail();
    } catch (err) {
      expect(err.message).to.equal(testErrorMessage);
    }
  });
  it('Branching fails when Octokit list branch fails', async () => {
    const branchResponseBody = await import(
      './fixtures/get-branch-response.json'
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    };
    sandbox.stub(octokit.repos, 'getBranch').resolves(branchResponse);
    sandbox.stub(octokit.git, 'getRef').rejects(Error(testErrorMessage));
    try {
      await branch(octokit, origin, upstream, branchName, 'master');
      assert.fail();
    } catch (err) {
      expect(err.message).to.equal(testErrorMessage);
    }
  });
  it('Branching fails when Octokit create ref fails', async () => {
    const branchResponseBody = await import(
      './fixtures/get-branch-response.json'
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    };
    sandbox.stub(octokit.repos, 'getBranch').resolves(branchResponse);
    const getRefError = Error('Not Found');
    Object.assign(getRefError, {status: 404});
    sandbox.stub(octokit.git, 'getRef').rejects(getRefError);
    sandbox.stub(octokit.git, 'createRef').rejects(Error(testErrorMessage));
    try {
      await branch(octokit, origin, upstream, branchName, 'master');
      assert.fail();
    } catch (err) {
      expect(err.message).to.equal(testErrorMessage);
    }
  });
  it('Branching fails when primary branch specified did not match any of the branches returned', async () => {
    const branchResponseBody = await import(
      './fixtures/get-branch-response.json'
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    };
    sandbox.stub(octokit.repos, 'getBranch').resolves(branchResponse);
    try {
      await branch(octokit, origin, upstream, branchName, 'non-master-branch');
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
  });
  it('the reference string parsing function correctly appends branch name to reference prefix', () => {
    assert.equal(createRef('master'), 'refs/heads/master');
    assert.equal(createRef('foo/bar/baz'), 'refs/heads/foo/bar/baz');
    assert.equal(createRef('+++'), 'refs/heads/+++');
  });
});
