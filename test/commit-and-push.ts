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
import * as handler from '../src/github-handler/commit-and-push-handler';
import {
  Changes,
  FileData,
  GitCreateTreeParamsTree,
  RepoDomain,
} from '../src/types';

before(() => {
  setup();
});

describe('Push', async () => {
  const changes: Changes = new Map();
  changes.set('a/foo.txt', new FileData('Foo content'));
  changes.set('b/bar.txt', new FileData(null));
  changes.set('baz.exe', new FileData(null, '100755'));
  changes.set('empty.txt', new FileData(''));

  const tree: GitCreateTreeParamsTree[] = [
    {
      path: 'a/foo.txt',
      mode: '100644',
      type: 'blob',
      content: 'Foo content',
    },
    {
      path: 'b/bar.txt',
      mode: '100644',
      type: 'blob',
      sha: null,
    },
    {
      path: 'baz.exe',
      mode: '100755',
      type: 'blob',
      sha: null,
    },
    {
      path: 'empty.txt',
      mode: '100644',
      type: 'blob',
      content: '',
    },
  ];
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const sha = 'asdf1234';

  describe('GitHub trees', () => {
    it('has objects that are generated correctly', () => {
      expect(handler.generateTreeObjects(changes)).to.deep.equal(tree);
    });

    it('Calls octokit functions with correct params', async () => {
      const commitResponseData = await import(
        './fixtures/get-commit-response.json'
      );
      const createTreeResponseData = await import(
        './fixtures/create-tree-response.json'
      );
      const getCommitResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: commitResponseData,
      };
      const createTreeResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: createTreeResponseData,
      };
      // setup
      const stub1 = sinon
        .stub(octokit.git, 'getCommit')
        .resolves(getCommitResponse);
      const stub2 = sinon
        .stub(octokit.git, 'createTree')
        .resolves(createTreeResponse);
      // tests
      const treeSha = await handler.createTree(
        logger,
        octokit,
        origin,
        sha,
        tree
      );
      sinon.assert.calledOnceWithExactly(stub1, {
        owner: origin.owner,
        repo: origin.repo,
        commit_sha: sha,
      });
      sinon.assert.calledWithExactly(stub2, {
        owner: origin.owner,
        repo: origin.repo,
        tree,
        base_tree: getCommitResponse.data.tree.sha,
      });
      expect(treeSha).to.equal(createTreeResponse.data.sha);
      // restore
      stub1.restore();
      stub2.restore();
    });
  });
});

describe('Commit', () => {
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const treeSha = 'TREE-asfd1234';
  const head = 'head-asdf1234';
  const message = 'Hello world';
  it('Invokes octokit function called with correct values', async () => {
    // setup
    const createCommitResponseData = await import(
      './fixtures/create-commit-response.json'
    );
    const createCommitResponse = {
      headers: {},
      status: 201,
      url: 'http://fake-url.com',
      data: createCommitResponseData,
    };
    const stub = sinon
      .stub(octokit.git, 'createCommit')
      .resolves(createCommitResponse);
    // tests
    const sha = await handler.createCommit(
      logger,
      octokit,
      origin,
      head,
      treeSha,
      message
    );
    expect(sha).equals(createCommitResponse.data.sha);
    sinon.assert.calledOnceWithExactly(stub, {
      owner: origin.owner,
      repo: origin.repo,
      message,
      tree: treeSha,
      parents: [head],
    });
    // restore
    stub.restore();
  });
});

describe('Update branch reference', () => {
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const sha = 'asdf1234';
  it('Invokes octokit function called with correct values', async () => {
    // setup
    const stub = sinon.stub(octokit.git, 'updateRef');
    // tests
    await handler.updateRef(logger, octokit, origin, 'test-branch-name', sha);
    sinon.assert.calledOnceWithExactly(stub, {
      owner: origin.owner,
      repo: origin.repo,
      sha,
      ref: 'heads/test-branch-name',
    });
    // restore
    stub.restore();
  });
});

describe('Commit and push function', () => {
  const oldHeadSha = 'OLD-head-Sha-asdf1234';
  const changes: Changes = new Map();
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const branchName = 'test-branch-name';
  const message = 'Hello world';
  describe('Works when everything works', () => {
    it('Calls functions with correct parameter values', async () => {
      const commitResponseData = await import(
        './fixtures/get-commit-response.json'
      );
      const createTreeResponseData = await import(
        './fixtures/create-tree-response.json'
      );
      const getCommitResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: commitResponseData,
      };
      const createTreeResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: createTreeResponseData,
      };

      const createCommitResponseData = await import(
        './fixtures/create-commit-response.json'
      );
      const createCommitResponse = {
        headers: {},
        status: 201,
        url: 'http://fake-url.com',
        data: createCommitResponseData,
      };
      // setup
      const stubGetCommit = sinon
        .stub(octokit.git, 'getCommit')
        .resolves(getCommitResponse);
      const stubCreateTree = sinon
        .stub(octokit.git, 'createTree')
        .resolves(createTreeResponse);
      const stubCreateCommit = sinon
        .stub(octokit.git, 'createCommit')
        .resolves(createCommitResponse);
      const stubUpdateRef = sinon.stub(octokit.git, 'updateRef');
      // tests
      await handler.commitAndPush(
        logger,
        octokit,
        oldHeadSha,
        changes,
        origin,
        branchName,
        message
      );
      sinon.assert.calledOnceWithExactly(stubGetCommit, {
        owner: origin.owner,
        repo: origin.repo,
        commit_sha: oldHeadSha,
      });
      sinon.assert.calledWithExactly(stubCreateTree, {
        owner: origin.owner,
        repo: origin.repo,
        tree: [],
        base_tree: getCommitResponse.data.tree.sha,
      });
      sinon.assert.calledOnceWithExactly(stubCreateCommit, {
        owner: origin.owner,
        repo: origin.repo,
        message,
        tree: createTreeResponse.data.sha,
        parents: [oldHeadSha],
      });
      sinon.assert.calledOnceWithExactly(stubUpdateRef, {
        owner: origin.owner,
        repo: origin.repo,
        sha: createCommitResponse.data.sha,
        ref: 'heads/test-branch-name',
      });
      // restore
      stubGetCommit.restore();
      stubCreateTree.restore();
      stubCreateCommit.restore();
      stubUpdateRef.restore();
    });
  });
  describe('Fails and forwards the error message if any octokit function fails', () => {
    it('Forwards GitHub error if getCommit fails', async () => {
      // setup
      const commitErrorMsg = 'Error committing';
      const stubGetCommit = sinon
        .stub(octokit.git, 'getCommit')
        .rejects(Error(commitErrorMsg));
      try {
        // tests
        await handler.createTree(logger, octokit, origin, '', []);
      } catch (err) {
        expect(err.message).to.equal(commitErrorMsg);
      } finally {
        stubGetCommit.restore();
      }
    });
    it('Forwards GitHub error if createTree fails', async () => {
      // setup
      const commitResponseData = await import(
        './fixtures/get-commit-response.json'
      );
      const getCommitResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: commitResponseData,
      };
      const createTreeErrorMsg = 'Error committing';
      const stubGetCommit = sinon
        .stub(octokit.git, 'getCommit')
        .resolves(getCommitResponse);
      const stubCreateTree = sinon
        .stub(octokit.git, 'createTree')
        .rejects(Error(createTreeErrorMsg));
      try {
        // tests
        await handler.createTree(logger, octokit, origin, '', []);
      } catch (err) {
        expect(err.message).to.equal(createTreeErrorMsg);
      } finally {
        stubGetCommit.restore();
        stubCreateTree.restore();
      }
    });
    it('Forwards GitHub error if createCommit fails', async () => {
      // setup
      const commitResponseData = await import(
        './fixtures/get-commit-response.json'
      );
      const getCommitResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: commitResponseData,
      };
      const createTreeResponseData = await import(
        './fixtures/create-tree-response.json'
      );
      const createTreeResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: createTreeResponseData,
      };
      const stubGetCommit = sinon
        .stub(octokit.git, 'getCommit')
        .resolves(getCommitResponse);
      const stubCreateTree = sinon
        .stub(octokit.git, 'createTree')
        .resolves(createTreeResponse);
      const createCommitErrorMsg = 'Error creating commit';
      const stubCreateCommit = sinon
        .stub(octokit.git, 'createCommit')
        .rejects(Error(createCommitErrorMsg));
      try {
        // tests
        await handler.createTree(logger, octokit, origin, '', []);
      } catch (err) {
        expect(err.message).to.equal(createCommitErrorMsg);
      } finally {
        stubGetCommit.restore();
        stubCreateTree.restore();
        stubCreateCommit.restore();
      }
    });
    it('Forwards GitHub error if updateRef fails', async () => {
      // setup
      const commitResponseData = await import(
        './fixtures/get-commit-response.json'
      );
      const getCommitResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: commitResponseData,
      };
      const createTreeResponseData = await import(
        './fixtures/create-tree-response.json'
      );
      const createTreeResponse = {
        headers: {},
        status: 200,
        url: 'http://fake-url.com',
        data: createTreeResponseData,
      };

      const createCommitResponseData = await import(
        './fixtures/create-commit-response.json'
      );
      const createCommitResponse = {
        headers: {},
        status: 201,
        url: 'http://fake-url.com',
        data: createCommitResponseData,
      };
      const stubGetCommit = sinon
        .stub(octokit.git, 'getCommit')
        .resolves(getCommitResponse);
      const stubCreateTree = sinon
        .stub(octokit.git, 'createTree')
        .resolves(createTreeResponse);
      const stubCreateCommit = sinon
        .stub(octokit.git, 'createCommit')
        .resolves(createCommitResponse);
      const updateRefErrorMsg = 'Error updating reference';
      const stubUpdateRef = sinon
        .stub(octokit.git, 'updateRef')
        .rejects(Error(updateRefErrorMsg));
      try {
        // tests
        await handler.createTree(logger, octokit, origin, '', []);
      } catch (err) {
        expect(err.message).to.equal(updateRefErrorMsg);
      } finally {
        stubGetCommit.restore();
        stubCreateTree.restore();
        stubCreateCommit.restore();
        stubUpdateRef.restore();
      }
    });
  });
});
