import {describe, it, afterEach} from 'mocha';
import {assert, expect} from 'chai';
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
    assert.isOk(true);
  });
  it('fails when there is no env variable', async () => {
    try {
      sandbox.stub(process.env, 'ACCESS_TOKEN').value(undefined);
      await main();
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
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
    try {
      await stubWorkFlow.main();
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
  });

  it('Passes up the error message when fetching change failed', async () => {
    // setup
    sandbox
      .stub(process, 'env')
      .value({...process.env, ACCESS_TOKEN: '123121312'});
    sandbox.stub(yargs, 'argv').value({...yargs.argv, _: ['unrecognized']});
    try {
      await main();
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
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

    expect(coerceUserCreatePullRequestOptions()).to.deep.equals(options);
  });
});
