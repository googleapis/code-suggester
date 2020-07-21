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
import {openPr} from '../src/github-handler/pr-handler';

before(() => {
  setup();
});

describe('Opening a pull request', async () => {
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const origin = {
    owner: 'origin-owner',
    repo: 'origin-repo',
    branch: 'pr-test-branch',
  };
  const responseData = await import('./fixtures/create-pr-response.json');
  const description = {
    title: 'PR-TITLE',
    body: 'PR-DESCRIPTION',
  };

  describe('Octokit create function', () => {
    it('Is called with the correct values and defaults', async () => {
      const createRefResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: responseData,
      };
      // setup
      const stub = sinon
        .stub(octokit.pulls, 'create')
        .resolves(createRefResponse);
      // tests
      await openPr(octokit, upstream, origin, description);
      sinon.assert.calledOnceWithExactly(stub, {
        owner: upstream.owner,
        repo: origin.repo,
        title: description.title,
        head: 'origin-owner:pr-test-branch',
        base: 'master',
        body: description.body,
        maintainer_can_modify: true,
      });
      // restore
      stub.restore();
    });
  });

  describe('Open PR function', () => {
    it('Passes up the error message with a throw when octokit fails', async () => {
      // setup
      const errorMsg = 'Error message';
      const stub = sinon.stub(octokit.pulls, 'create').rejects(Error(errorMsg));
      try {
        await openPr(octokit, upstream, origin, description);
        expect.fail();
      } catch (err) {
        expect(err.message).to.equal(errorMsg);
      } finally {
        // restore
        stub.restore();
      }
    });
  });
});
