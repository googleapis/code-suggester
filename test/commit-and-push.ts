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
import {Changes, FileData, TreeObject, RepoDomain} from '../src/types';

before(() => {
  setup();
});

describe('Push', () => {
  const sandbox = sinon.createSandbox();
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const sha = 'asdf1234';
  afterEach(() => {
    sandbox.restore();
  });

  it('GitHub tree objects that are generated correctly for text files in a sub-directory', () => {
    const changes: Changes = new Map();
    changes.set('a/foo.txt', new FileData('Foo content'));
    expect(handler.generateTreeObjects(changes)).to.deep.equal([
      {
        path: 'a/foo.txt',
        mode: '100644',
        type: 'blob',
        content: 'Foo content',
      },
    ]);
  });
  it('has objects that are generated correctly for text files that are deleted', () => {
    const changes: Changes = new Map();
    changes.set('b/bar.txt', new FileData(null));
    expect(handler.generateTreeObjects(changes)).to.deep.equal([
      {
        path: 'b/bar.txt',
        mode: '100644',
        type: 'blob',
        sha: null,
      },
    ]);
  });
  it('has objects that are generated correctly for deleted exe files', () => {
    const changes: Changes = new Map();
    changes.set('baz.exe', new FileData(null, '100755'));
    expect(handler.generateTreeObjects(changes)).to.deep.equal([
      {
        path: 'baz.exe',
        mode: '100755',
        type: 'blob',
        sha: null,
      },
    ]);
  });
  it('has objects that are generated correctly for empty text files', () => {
    const changes: Changes = new Map();
    changes.set('empty.txt', new FileData(''));
    expect(handler.generateTreeObjects(changes)).to.deep.equal([
      {
        path: 'empty.txt',
        mode: '100644',
        type: 'blob',
        content: '',
      },
    ]);
  });

  it('Calls octokit functions with correct params', async () => {
    const tree: TreeObject[] = [
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
    const stubGetCommit = sandbox
      .stub(octokit.git, 'getCommit')
      .resolves(getCommitResponse);
    const stubCreateTree = sandbox
      .stub(octokit.git, 'createTree')
      .resolves(createTreeResponse);
    // tests
    const treeSha = await handler.createTree(octokit, origin, sha, tree);
    sandbox.assert.calledOnceWithExactly(stubGetCommit, {
      owner: origin.owner,
      repo: origin.repo,
      commit_sha: sha,
    });
    sandbox.assert.calledWithExactly(stubCreateTree, {
      owner: origin.owner,
      repo: origin.repo,
      tree,
      base_tree: getCommitResponse.data.tree.sha,
    });
    expect(treeSha).to.equal(createTreeResponse.data.sha);
  });
});

describe('Commit', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
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
    const stubCreateCommit = sandbox
      .stub(octokit.git, 'createCommit')
      .resolves(createCommitResponse);
    // tests
    const sha = await handler.createCommit(
      octokit,
      origin,
      head,
      treeSha,
      message
    );
    expect(sha).equals(createCommitResponse.data.sha);
    sandbox.assert.calledOnceWithExactly(stubCreateCommit, {
      owner: origin.owner,
      repo: origin.repo,
      message,
      tree: treeSha,
      parents: [head],
    });
  });
});

describe('Update branch reference', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const sha = 'asdf1234';
  it('Invokes octokit function called with correct values', async () => {
    // setup
    const stubUpdateRef = sandbox.stub(octokit.git, 'updateRef');
    // tests
    await handler.updateRef(
      octokit,
      {branch: 'test-branch-name', ...origin},
      sha
    );
    sandbox.assert.calledOnceWithExactly(stubUpdateRef, {
      owner: origin.owner,
      repo: origin.repo,
      sha,
      ref: 'heads/test-branch-name',
    });
  });
});

describe('Commit and push function', async () => {
  const sandbox = sinon.createSandbox();
  const oldHeadSha = 'OLD-head-Sha-asdf1234';
  const changes: Changes = new Map();
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const branchName = 'test-branch-name';
  const message = 'Hello world';

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
  afterEach(() => {
    sandbox.restore();
  });
  it('When everything works it calls functions with correct parameter values', async () => {
    // setup
    const stubGetCommit = sandbox
      .stub(octokit.git, 'getCommit')
      .resolves(getCommitResponse);
    const stubCreateTree = sandbox
      .stub(octokit.git, 'createTree')
      .resolves(createTreeResponse);
    const stubCreateCommit = sandbox
      .stub(octokit.git, 'createCommit')
      .resolves(createCommitResponse);
    const stubUpdateRef = sandbox.stub(octokit.git, 'updateRef');
    // tests
    await handler.commitAndPush(
      octokit,
      oldHeadSha,
      changes,
      {branch: branchName, ...origin},
      message
    );
    sandbox.assert.calledOnceWithExactly(stubGetCommit, {
      owner: origin.owner,
      repo: origin.repo,
      commit_sha: oldHeadSha,
    });
    sandbox.assert.calledWithExactly(stubCreateTree, {
      owner: origin.owner,
      repo: origin.repo,
      tree: [],
      base_tree: getCommitResponse.data.tree.sha,
    });
    sandbox.assert.calledOnceWithExactly(stubCreateCommit, {
      owner: origin.owner,
      repo: origin.repo,
      message,
      tree: createTreeResponse.data.sha,
      parents: [oldHeadSha],
    });
    sandbox.assert.calledOnceWithExactly(stubUpdateRef, {
      owner: origin.owner,
      repo: origin.repo,
      sha: createCommitResponse.data.sha,
      ref: 'heads/test-branch-name',
    });
  });
  it('Forwards GitHub error if getCommit fails', async () => {
    // setup
    const commitErrorMsg = 'Error committing';
    sandbox.stub(octokit.git, 'getCommit').rejects(Error(commitErrorMsg));
    try {
      // tests
      await handler.createTree(octokit, origin, '', []);
    } catch (err) {
      expect(err.message).to.equal(commitErrorMsg);
    }
  });
  it('Forwards GitHub error if createTree fails', async () => {
    // setup
    const createTreeErrorMsg = 'Error committing';
    sandbox.stub(octokit.git, 'getCommit').resolves(getCommitResponse);
    sandbox.stub(octokit.git, 'createTree').rejects(Error(createTreeErrorMsg));
    try {
      // tests
      await handler.createTree(octokit, origin, '', []);
    } catch (err) {
      expect(err.message).to.equal(createTreeErrorMsg);
    }
  });
  it('Forwards GitHub error if createCommit fails', async () => {
    // setup
    sandbox.stub(octokit.git, 'getCommit').resolves(getCommitResponse);
    sandbox.stub(octokit.git, 'createTree').resolves(createTreeResponse);
    const createCommitErrorMsg = 'Error creating commit';
    sandbox
      .stub(octokit.git, 'createCommit')
      .rejects(Error(createCommitErrorMsg));
    try {
      // tests
      await handler.createTree(octokit, origin, '', []);
    } catch (err) {
      expect(err.message).to.equal(createCommitErrorMsg);
    }
  });
  it('Forwards GitHub error if updateRef fails', async () => {
    // setup
    sandbox.stub(octokit.git, 'getCommit').resolves(getCommitResponse);
    sandbox.stub(octokit.git, 'createTree').resolves(createTreeResponse);
    sandbox.stub(octokit.git, 'createCommit').resolves(createCommitResponse);
    const updateRefErrorMsg = 'Error updating reference';
    sandbox.stub(octokit.git, 'updateRef').rejects(Error(updateRefErrorMsg));
    try {
      // tests
      await handler.createTree(octokit, origin, '', []);
    } catch (err) {
      expect(err.message).to.equal(updateRefErrorMsg);
    }
  });
});
