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
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {openPullRequest} from '../src/github-handler/pull-request-handler';

before(() => {
  setup();
});

describe('Opening a pull request', async () => {
  const sandbox = sinon.createSandbox();
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const origin = {
    owner: 'origin-owner',
    repo: 'origin-repo',
    branch: 'pr-test-branch',
  };
  const description = {
    title: 'PR-TITLE',
    body: 'PR-DESCRIPTION',
  };
  afterEach(() => {
    sandbox.restore();
  });

  it('Invokes octokit pull create when there is not an existing pull request open', async () => {
    // setup
    const responseCreatePullData = await import(
      './fixtures/create-pr-response.json'
    );
    const createPrResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: responseCreatePullData,
    };
    const listPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [],
    };
    sandbox.stub(octokit.pulls, 'list').resolves(listPullResponse);
    const stub = sandbox
      .stub(octokit.pulls, 'create')
      .resolves(createPrResponse);
    // tests
    await openPullRequest(octokit, upstream, origin, description);
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: origin.repo,
      title: description.title,
      head: 'origin-owner:pr-test-branch',
      base: 'master',
      body: description.body,
      maintainer_can_modify: true,
    });
  });

  it('Does not invoke octokit pull create when there is an existing pull request open', async () => {
    // setup
    const responseListPullData = await import(
      './fixtures/list-pulls-response.json'
    );
    const listPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: responseListPullData,
    };

    const conflictingOrigin = {
      owner: 'octocat',
      repo: 'Hello-World',
      branch: 'new-topic',
    };
    const listStub = sandbox
      .stub(octokit.pulls, 'list')
      .resolves(listPullResponse);
    const createStub = sandbox.stub(octokit.pulls, 'create');
    // tests
    await openPullRequest(octokit, upstream, conflictingOrigin, description);
    sandbox.assert.calledOnceWithExactly(listStub, {
      owner: upstream.owner,
      repo: conflictingOrigin.repo,
      head: 'octocat:new-topic',
    });
    sandbox.assert.notCalled(createStub);
  });

  it('Passes up the error message with a throw when octokit list pull fails', async () => {
    // setup
    const errorMsg = 'Error message';
    sandbox.stub(octokit.pulls, 'list').rejects(Error(errorMsg));
    try {
      await openPullRequest(octokit, upstream, origin, description);
      expect.fail();
    } catch (err) {
      expect(err.message).to.equal(errorMsg);
    }
  });

  it('Passes up the error message with a throw when octokit create pull fails', async () => {
    // setup
    const listPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [],
    };
    sandbox.stub(octokit.pulls, 'list').resolves(listPullResponse);
    const errorMsg = 'Error message';
    sandbox.stub(octokit.pulls, 'create').rejects(Error(errorMsg));
    try {
      await openPullRequest(octokit, upstream, origin, description);
      expect.fail();
    } catch (err) {
      expect(err.message).to.equal(errorMsg);
    }
  });
});
