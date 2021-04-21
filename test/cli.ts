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
import {describe, it, afterEach} from 'mocha';
import * as assert from 'assert';
import {main, coerceUserCreatePullRequestOptions} from '../src/bin/workflow';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import * as yargs from 'yargs';

describe('main', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('Does not error', async () => {
    // setup
    sandbox
      .stub(process, 'env')
      .value({...process.env, ACCESS_TOKEN: '123121312'});
    sandbox
      .stub(yargs, 'argv')
      .value({...yargs.argv, _: ['pr'], 'git-dir': 'some/dir'});
    const stubHelperHandlers = {
      getChanges: () => {
        return new Promise(resolve => {
          resolve(new Map());
        });
      },
    };
    const stubWorkFlow = proxyquire.noCallThru()('../src/bin/workflow', {
      './handle-git-dir-change': stubHelperHandlers,
    });
    stubWorkFlow.main();
  });
  it('fails when there is no env variable', async () => {
    sandbox
      .stub(process, 'env')
      .value({...process.env, ACCESS_TOKEN: undefined});
    await assert.rejects(main());
  });

  it('Fails when unrecognized command is given', async () => {
    // setup
    sandbox
      .stub(process, 'env')
      .value({...process.env, ACCESS_TOKEN: '123121312'});
    sandbox
      .stub(yargs, 'argv')
      .value({...yargs.argv, _: ['unknown-command'], 'git-dir': 'some/dir'});
    const stubHelperHandlers = {
      getChanges: () => {
        return new Promise((resolve, reject) => {
          reject(Error());
        });
      },
    };
    const stubWorkFlow = proxyquire.noCallThru()('../src/bin/workflow', {
      './handle-git-dir-change': stubHelperHandlers,
    });
    await assert.rejects(stubWorkFlow.main());
  });

  it('Passes up the error message when fetching change failed', async () => {
    // setup
    sandbox
      .stub(process, 'env')
      .value({...process.env, ACCESS_TOKEN: '123121312'});
    sandbox.stub(yargs, 'argv').value({...yargs.argv, _: ['unrecognized']});
    await assert.rejects(main());
  });
});

describe('Mapping pr yargs to create PR options', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('Creates', () => {
    const options = {
      upstreamRepo: 'foo',
      upstreamOwner: 'bar',
      message: 'message',
      description: 'description',
      title: 'title',
      branch: 'branch',
      force: false,
      primary: 'primary',
      maintainersCanModify: true,
      fork: true,
      labels: ['automerge'],
    };
    sandbox.stub(yargs, 'argv').value({_: ['pr'], ...options});
    assert.deepStrictEqual(coerceUserCreatePullRequestOptions(), options);
  });
});
