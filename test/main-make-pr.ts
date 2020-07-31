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

import {assert, expect} from 'chai';
import {describe, it, before, afterEach} from 'mocha';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {Changes, FileData, CreatePullRequestUserOptions} from '../src/types';
import {Octokit} from '@octokit/rest';
import * as proxyquire from 'proxyquire';

before(() => {
  setup();
});

// tslint:disable:no-unused-expression
// .true triggers ts-lint failure, but is valid chai
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
  const options: CreatePullRequestUserOptions = {
    upstreamOwner,
    upstreamRepo,
    branch,
    description,
    title,
    force,
    message,
    primary,
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
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
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
        expect(origin.owner).equals(originOwner);
        expect(origin.repo).equals(originRepo);
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
        expect(testBranch).equals(branch);
        expect(testprimary).equals(primary);
        return oldHeadSha;
      },
      commitAndPush: (
        octokit: Octokit,
        testOldHeadSha: string,
        testChanges: Changes,
        originBranch: {owner: string; repo: string; branch: string},
        testMessage: string
      ) => {
        expect(testOldHeadSha).equals(oldHeadSha);
        expect(originBranch.owner).equals(originOwner);
        expect(originBranch.repo).equals(originRepo);
        expect(originBranch.branch).equals(branch);
        expect(testChanges).deep.equals(changes);
        expect(testMessage).equals(message);
      },
      openPullRequest: (
        octokit: Octokit,
        upstream: {owner: string; repo: string},
        originBranch: {owner: string; repo: string; branch: string},
        testDescription: {title: string; body: string},
        testMaintainersCanModify: boolean,
        testPrimary: string
      ) => {
        expect(originBranch.owner).equals(originOwner);
        expect(originBranch.repo).equals(originRepo);
        expect(originBranch.branch).equals(branch);
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
        expect(testDescription.body).equals(description);
        expect(testDescription.title).equals(title);
        expect(testMaintainersCanModify).equals(maintainersCanModify);
        expect(testPrimary).equals(primary);
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    await stubMakePr.createPullRequest(octokit, changes, options);
  });

  it('Passes up the error message with a throw when create fork helper function fails', async () => {
    // setup

    const stubHelperHandlers = {
      fork: () => {
        throw Error('Create fork helper failed');
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    try {
      await stubMakePr.createPullRequest(octokit, changes, options);
      expect.fail(
        'The main function should have errored because the fork helper function failed.'
      );
    } catch (err) {
      expect(err.message).equals('Create fork helper failed');
    }
  });
  it('Passes up the error message with a throw when create branch helper fails', async () => {
    // setup

    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
        return {
          owner: originOwner,
          repo: originRepo,
        };
      },
      branch: () => {
        throw Error('Create branch helper failed');
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    try {
      await stubMakePr.createPullRequest(octokit, changes, options);
      expect.fail(
        'The main function should have errored because the branch helper function failed.'
      );
    } catch (err) {
      expect(err.message).equals('Create branch helper failed');
    }
  });
  it('Passes up the error message with a throw when helper commit and push helper function fails', async () => {
    // setup

    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
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
        expect(origin.owner).equals(originOwner);
        expect(origin.repo).equals(originRepo);
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
        expect(testBranch).equals(branch);
        expect(testprimary).equals(primary);
        return oldHeadSha;
      },
      commitAndPush: () => {
        throw Error('Commit and push helper failed');
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    try {
      await stubMakePr.createPullRequest(octokit, changes, options);
      expect.fail(
        'The main function should have errored because the commit and push helper function failed.'
      );
    } catch (err) {
      expect(err.message).equals('Commit and push helper failed');
    }
  });
  it('Passes up the error message with a throw when helper create pr helper function fails', async () => {
    // setup

    const stubHelperHandlers = {
      fork: (octokit: Octokit, upstream: {owner: string; repo: string}) => {
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
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
        expect(origin.owner).equals(originOwner);
        expect(origin.repo).equals(originRepo);
        expect(upstream.owner).equals(upstreamOwner);
        expect(upstream.repo).equals(upstreamRepo);
        expect(testBranch).equals(branch);
        expect(testprimary).equals(primary);
        return oldHeadSha;
      },
      commitAndPush: (
        octokit: Octokit,
        testOldHeadSha: string,
        testChanges: Changes,
        originBranch: {owner: string; repo: string; branch: string},
        testMessage: string
      ) => {
        expect(testOldHeadSha).equals(oldHeadSha);
        expect(originBranch.owner).equals(originOwner);
        expect(originBranch.repo).equals(originRepo);
        expect(originBranch.branch).equals(branch);
        expect(testChanges).deep.equals(changes);
        expect(testMessage).equals(message);
      },
      openPullRequest: () => {
        throw Error('Create PR helper failed');
      },
    };
    const stubMakePr = proxyquire.noCallThru()('../src/', {
      './github-handler': stubHelperHandlers,
    });
    try {
      await stubMakePr.createPullRequest(octokit, changes, options);
      expect.fail(
        'The main function should have errored because the commit and push helper function failed.'
      );
    } catch (err) {
      expect(err.message).equals('Create PR helper failed');
    }
  });
  it('Does not execute any GitHub API calls when there are no changes to commit', async () => {
    // setup
    const stubHelperHandlers = {
      fork: () => {
        expect.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
      branch: () => {
        expect.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
      commitAndPush: () => {
        expect.fail(
          'When changeset is null or undefined then GitHub forking should not execute'
        );
      },
      openPullRequest: () => {
        expect.fail(
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
    assert.isOk(true);
  });
});
