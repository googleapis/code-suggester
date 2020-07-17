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
import {describe, it, before} from 'mocha';
import {logger, octokit, setup} from './util';
import * as sinon from 'sinon';
import {fork} from '../src/github-handler/fork-handler';

before(() => {
  setup();
});

describe('Forking function', () => {
  const sandbox = sinon.createSandbox();
  beforeEach(() => {
    sandbox.restore();
  });
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  it('Calls Octokit with the correct values', async () => {
    const responseData = await import('./fixtures/create-fork-response.json');
    const createRefResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: responseData,
    };
    // setup
    const stub = sandbox
      .stub(octokit.repos, 'createFork')
      .resolves(createRefResponse);
    // tests
    await fork(logger, octokit, upstream);
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: upstream.repo,
    });
  });
  it('Returns correct values on success', async () => {
    const responseData = await import('./fixtures/create-fork-response.json');
    const createRefResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: responseData,
    };
    // setup
    sandbox.stub(octokit.repos, 'createFork').resolves(createRefResponse);
    // tests
    const res = await fork(logger, octokit, upstream);
    expect(res.owner).equals(responseData.owner.login);
    expect(res.repo).equals(responseData.name);
  });
  it('Passes the error message with a throw when octokit fails', async () => {
    // setup
    const errorMsg = 'Error message';
    sandbox.stub(octokit.repos, 'createFork').rejects(errorMsg);
    try {
      await fork(logger, octokit, upstream);
      expect.fail(
        'The fork function should have failed because Octokit failed.'
      );
    } catch (err) {
      expect(err.message).to.equal(errorMsg);
    }
  });
});
