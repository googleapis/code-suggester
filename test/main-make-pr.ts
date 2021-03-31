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
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {Changes, FileData, CreatePullRequestUserOptions} from '../src/types';
import {Octokit} from '@octokit/rest';
import * as proxyquire from 'proxyquire';
import * as retry from 'async-retry';
import * as idx from '../src/index';
import * as handler from '../src/github-handler/branch-handler';

before(() => {
  setup();
});

/* eslint-disable  @typescript-eslint/no-unused-vars */
describe('Make PR main function', () => {
  const upstreamOwner = 'owner';
  const upstreamRepo = 'Hello-World';
  const description = 'custom pr description';
  const branch = 'custom-code-suggestion-branch';
  const title = 'chore: code suggestions custom PR title';
  const force = true;
  const maintainersCanModify = true;
  const message = 'chore: code suggestions custom commit message';
  const primary = 'custom-primary';
  const originRepo = 'Hello-World';
  const originOwner = 'octocat';
  const labelsToAdd = ['automerge'];
  const options: CreatePullRequestUserOptions = {
    upstreamOwner,
    upstreamRepo,
    branch,
    description,
    title,
    force,
    message,
    primary,
    labels: labelsToAdd,
  };
  const oldHeadSha = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';
  const changes: Changes = new Map();
  changes.set('src/index.ts', new FileData("console.log('new file')"));

  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('Returns correct values on success', async () => {
    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        return {
          owner: originOwner,
          repo: originRepo,
        };
      },
      branch: (
        octokit: Octokit,
        origin: {owner: string; repo: string},
        upstream: {owner: string; repo: string},
        testBranch: string,
        testprimary: string
      ) => {
        assert.strictEqual(origin.owner, originOwner);
        assert.strictEqual(origin.repo, originRepo);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(testBranch, branch);
        assert.strictEqual(testprimary, primary);
        return oldHeadSha;
      },
      commitAndPush: (
        octokit: Octokit,
        testOldHeadSha: string,
        testChanges: Changes,
        originBranch: {owner: string; repo: string; branch: string},
        testMessage: string
      ) => {
        assert.strictEqual(testOldHeadSha, oldHeadSha);
        assert.strictEqual(originBranch.owner, originOwner);
        assert.strictEqual(originBranch.repo, originRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.deepStrictEqual(testChanges, changes);
        assert.strictEqual(testMessage, message);
      },
      openPullRequest: (
        octokit: Octokit,
        upstream: {owner: string; repo: string},
        originBranch: {owner: string; repo: string; branch: string},
        testDescription: {title: string; body: string},
        testMaintainersCanModify: boolean,
        testPrimary: string
      ) => {
        assert.strictEqual(originBranch.owner, originOwner);
        assert.strictEqual(originBranch.repo, originRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(testDescription.body, description);
        assert.strictEqual(testDescription.title, title);
        assert.strictEqual(testMaintainersCanModify, maintainersCanModify);
        assert.strictEqual(testPrimary, primary);
      },
      addLabels: (
        octokit: Octokit,
        upstream: {owner: string; repo: string},
        originBranch: {owner: string; repo: string; branch: string},
        issue_number: number,
        labels: string[]
      ) => {
        assert.strictEqual(originBranch.owner, originOwner);
        assert.strictEqual(originBranch.repo, originRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(labels, labelsToAdd);
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubMakePr.createPullRequest(octokit, changes, options);
  });

  it('does not create fork when fork is false', async () => {
    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        throw Error('should not call fork');
      },
      branch: (
        octokit: Octokit,
        origin: {owner: string; repo: string},
        upstream: {owner: string; repo: string},
        testBranch: string,
        testprimary: string
      ) => {
        assert.strictEqual(upstream.owner, origin.owner);
        assert.strictEqual(upstream.repo, origin.repo);
        return oldHeadSha;
      },
      commitAndPush: (
        octokit: Octokit,
        testOldHeadSha: string,
        testChanges: Changes,
        originBranch: {owner: string; repo: string; branch: string},
        testMessage: string
      ) => {
        assert.strictEqual(testOldHeadSha, oldHeadSha);
        assert.strictEqual(originBranch.owner, upstreamOwner);
        assert.strictEqual(originBranch.repo, upstreamRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.deepStrictEqual(testChanges, changes);
        assert.strictEqual(testMessage, message);
      },
      openPullRequest: (
        octokit: Octokit,
        upstream: {owner: string; repo: string},
        originBranch: {owner: string; repo: string; branch: string},
        testDescription: {title: string; body: string},
        testMaintainersCanModify: boolean,
        testPrimary: string
      ) => {
        assert.strictEqual(originBranch.owner, upstreamOwner);
        assert.strictEqual(originBranch.repo, upstreamRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(testDescription.body, description);
        assert.strictEqual(testDescription.title, title);
        assert.strictEqual(testMaintainersCanModify, maintainersCanModify);
        assert.strictEqual(testPrimary, primary);
      },
      addLabels: (
        octokit: Octokit,
        upstream: {owner: string; repo: string},
        originBranch: {owner: string; repo: string; branch: string},
        issue_number: number,
        labels: string[]
      ) => {
        assert.strictEqual(originBranch.owner, upstreamOwner);
        assert.strictEqual(originBranch.repo, upstreamRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(labels, labelsToAdd);
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubMakePr.createPullRequest(
      octokit,
      changes,
      Object.assign({fork: false}, options)
    );
  });

  it('Passes up the error message with a throw when create fork helper function fails', async () => {
    const error = new Error('Create fork helper failed');
    const stubHelperHandlers = {
      fork: () => {
        throw error;
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await assert.rejects(
      stubMakePr.createPullRequest(octokit, changes, options),
      error
    );
  });
  it('Passes up the error message with a throw when create branch helper fails', async () => {
    // setup
    const error = new Error('Create branch helper failed');
    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        return {
          owner: originOwner,
          repo: originRepo,
        };
      },
      branch: () => {
        throw error;
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
      'async-retry': async (
        fn: Function,
        options: {[index: string]: unknown}
      ) => {
        assert.strictEqual(options.retries, 5);
        assert.strictEqual(options.factor, 2.8411);
        assert.strictEqual(options.minTimeout, 3000);
        assert.strictEqual(options.randomize, false);
        await retry(() => fn(), {
          retries: 0,
        });
      },
    });
    await assert.rejects(
      stubMakePr.createPullRequest(octokit, changes, options),
      error
    );
  });

  it('should respect the retry flag', async () => {
    const stub = sinon.stub(handler, 'branch').throws('boop');
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    await assert.rejects(
      idx.createPullRequest(octokit, changes, {
        title: 'hello',
        message: 'hello',
        description: 'hello',
        fork: false,
        upstreamOwner: 'googleapis',
        upstreamRepo: 'nodejs-storage',
        retry: 0,
      }),
      /boop/
    );
    assert.ok(stub.calledOnce);
  });

  it('Passes up the error message with a throw when helper commit and push helper function fails', async () => {
    // setup
    const error = new Error('Commit and push helper failed');
    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        return {
          owner: originOwner,
          repo: originRepo,
        };
      },
      branch: (
        octokit: Octokit,
        origin: {owner: string; repo: string},
        upstream: {owner: string; repo: string},
        testBranch: string,
        testprimary: string
      ) => {
        assert.strictEqual(origin.owner, originOwner);
        assert.strictEqual(origin.repo, originRepo);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(testBranch, branch);
        assert.strictEqual(testprimary, primary);
        return oldHeadSha;
      },
      commitAndPush: () => {
        throw error;
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await assert.rejects(
      stubMakePr.createPullRequest(octokit, changes, options),
      error
    );
  });
  it('Passes up the error message with a throw when helper create pr helper function fails', async () => {
    // setup
    const error = new Error('Create PR helper failed');
    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        return {
          owner: originOwner,
          repo: originRepo,
        };
      },
      branch: (
        octokit: Octokit,
        origin: {owner: string; repo: string},
        upstream: {owner: string; repo: string},
        testBranch: string,
        testprimary: string
      ) => {
        assert.strictEqual(origin.owner, originOwner);
        assert.strictEqual(origin.repo, originRepo);
        assert.strictEqual(upstream.owner, upstreamOwner);
        assert.strictEqual(upstream.repo, upstreamRepo);
        assert.strictEqual(testBranch, branch);
        assert.strictEqual(testprimary, primary);
        return oldHeadSha;
      },
      commitAndPush: (
        octokit: Octokit,
        testOldHeadSha: string,
        testChanges: Changes,
        originBranch: {owner: string; repo: string; branch: string},
        testMessage: string
      ) => {
        assert.strictEqual(testOldHeadSha, oldHeadSha);
        assert.strictEqual(originBranch.owner, originOwner);
        assert.strictEqual(originBranch.repo, originRepo);
        assert.strictEqual(originBranch.branch, branch);
        assert.deepStrictEqual(testChanges, changes);
        assert.strictEqual(testMessage, message);
      },
      openPullRequest: () => {
        throw error;
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await assert.rejects(
      stubMakePr.createPullRequest(octokit, changes, options),
      error
    );
  });
  it('Does not execute any GitHub API calls when there are no changes to commit', async () => {
    // setup
    const stubHelperHandlers = {
      fork: () => {
        assert.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
      branch: () => {
        assert.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
      commitAndPush: () => {
        assert.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
      openPullRequest: () => {
        assert.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubMakePr.createPullRequest(octokit, null, options);
    await stubMakePr.createPullRequest(octokit, undefined, options);
    await stubMakePr.createPullRequest(octokit, new Map(), options);
  });
});
