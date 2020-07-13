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

import {describe, it, before} from 'mocha';
import {assert, expect} from 'chai';
import {logger, octokit, setup} from './util';
import * as sinon from 'sinon';
import {
  branch,
  getBranchHead,
  createRef,
} from '../src/github-handler/branch-handler';

before(() => {
  setup();
});

describe('Branch module', async () => {
  const origin = {owner: 'octocat', repo: 'HelloWorld'};
  const branchName = 'test-branch';
  const branchResponseBody = await import(
    './fixtures/create-branch-response.json'
  );
  const branchResponse = {
    headers: {},
    status: 200,
    url: 'http://fake-url.com',
    data: branchResponseBody,
  };

  describe('Get branch head', () => {
    it('is passed the correct parameters, invokes octokit correctly, and returns the HEAD sha', async () => {
      // setup
      const getBranchStub = sinon
        .stub(octokit.repos, 'getBranch')
        .resolves(branchResponse);
      // // tests
      const headSHA = await getBranchHead(logger, octokit, origin, 'master');
      expect(headSHA).to.equal(branchResponse.data.commit.sha);
      sinon.assert.calledOnce(getBranchStub);
      sinon.assert.calledOnceWithExactly(getBranchStub, {
        owner: origin.owner,
        repo: origin.repo,
        branch: 'master',
      });

      // restore
      getBranchStub.restore();
    });
  });

  describe('The create branch function', () => {
    it('Returns the primary SHA when branching is successful', async () => {
      // setup
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
      const getBranchStub = sinon
        .stub(octokit.repos, 'getBranch')
        .resolves(branchResponse);
      const createRefStub = sinon
        .stub(octokit.git, 'createRef')
        .resolves(createRefResponse);
      // tests
      const sha = await branch(logger, octokit, origin, branchName, 'master');
      expect(sha).to.equal(branchResponse.data.commit.sha)
      sinon.assert.calledOnce(createRefStub);
      sinon.assert.calledOnceWithExactly(createRefStub, {
        owner: origin.owner,
        repo: origin.repo,
        ref: `refs/heads/${branchName}`,
        sha: branchResponse.data.commit.sha,
      });

      // restore
      createRefStub.restore();
      getBranchStub.restore();
    });
  });

  describe('Branching fails when', () => {
    const testErrorMessage = 'test-error-message';
    it('Octokit get branch fails', async () => {
      const getBranchStub = sinon
        .stub(octokit.repos, 'getBranch')
        .rejects(testErrorMessage);
      try {
        await branch(logger, octokit, origin, branchName, 'master');
        assert.fail();
      } catch (err) {
        expect(err.message).to.equal(testErrorMessage);
      } finally {
        getBranchStub.restore();
      }
    });
    it('Octokit create ref fails', async () => {
      const getBranchStub = sinon
        .stub(octokit.repos, 'getBranch')
        .resolves(branchResponse);
      const createRefStub = sinon
        .stub(octokit.git, 'createRef')
        .rejects(testErrorMessage);
      try {
        await branch(logger, octokit, origin, branchName, 'master');
        assert.fail();
      } catch (err) {
        expect(err.message).to.equal(testErrorMessage);
      } finally {
        getBranchStub.restore();
        createRefStub.restore();
      }
    });
    it('Primary branch specified did not match any of the branches returned', async () => {
      const listBranchesResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: [
          {
            name: 'master',
            commit: {
              sha: 'c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc',
              url:
                'https://api.github.com/repos/octocat/Hello-World/commits/c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc',
            },
            protected: true,
            protection: {
              enabled: true,
              required_status_checks: {
                enforcement_level: 'non_admins',
                contexts: ['ci-test', 'linter'],
              },
            },
            protection_url:
              'https://api.github.com/repos/octocat/hello-world/branches/master/protection',
          },
        ],
      };
      const getBranchStub = sinon
        .stub(octokit.repos, 'listBranches')
        .resolves(listBranchesResponse);
      try {
        await branch(logger, octokit, origin, branchName, 'non-master-branch');
        assert.fail();
      } catch (err) {
        assert.isOk(true);
      } finally {
        getBranchStub.restore();
      }
    });
  });

  describe('Reference string parsing function', () => {
    it('correctly appends branch name to reference prefix', () => {
      assert.equal(createRef('master'), 'refs/heads/master');
      assert.equal(createRef('foo/bar/baz'), 'refs/heads/foo/bar/baz');
      assert.equal(createRef('+++'), 'refs/heads/+++');
    });
  });
});
