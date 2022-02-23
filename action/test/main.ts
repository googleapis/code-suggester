// Copyright 2022 Google LLC
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

/* eslint-disable node/no-unpublished-import */
import {describe, it, beforeEach, afterEach} from 'mocha';
import {run as main} from '../src/main';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as core from '@actions/core';
import * as codeSuggesterModule from 'code-suggester';

const sandbox = sinon.createSandbox();

describe('pr', () => {
  let createPullRequestStub: sinon.SinonStub;
  let setOutputStub: sinon.SinonStub;
  beforeEach(() => {
    createPullRequestStub = sandbox.stub(
      codeSuggesterModule,
      'createPullRequest'
    );
    setOutputStub = sandbox.stub(core, 'setOutput');
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('parses inputs', async () => {
    createPullRequestStub.resolves(123);
    await withInputs(
      {
        command: 'pr',
        upstream_owner: 'testOwner',
        upstream_repo: 'testRepo',
        message: 'test message',
        title: 'test title',
        description: 'test description',
        branch: 'test-branch',
        force: 'true',
        fork: 'true',
        maintainers_can_modify: 'true',
        labels: 'abc',
      },
      main
    );

    sinon.assert.calledOnceWithMatch(createPullRequestStub);
    sinon.assert.calledOnceWithExactly(setOutputStub, 'pull', 123);
    const options = createPullRequestStub.firstCall
      .args[2] as codeSuggesterModule.CreatePullRequestUserOptions;
    assert.strictEqual(options.upstreamOwner, 'testOwner');
    assert.strictEqual(options.upstreamRepo, 'testRepo');
    assert.strictEqual(options.message, 'test message');
    assert.strictEqual(options.title, 'test title');
    assert.strictEqual(options.branch, 'test-branch');
    assert.ok(options.force);
    assert.ok(options.fork);
    assert.ok(options.maintainersCanModify);
    assert.deepStrictEqual(options.labels, ['abc']);
  });
  it('parses multiple labels', async () => {
    createPullRequestStub.resolves(123);
    await withInputs(
      {
        command: 'pr',
        upstream_owner: 'testOwner',
        upstream_repo: 'testRepo',
        message: 'test message',
        title: 'test title',
        description: 'test description',
        branch: 'test-branch',
        force: 'true',
        fork: 'true',
        maintainers_can_modify: 'true',
        labels: 'foo\nbar',
      },
      main
    );

    sinon.assert.calledOnceWithMatch(createPullRequestStub);
    sinon.assert.calledOnceWithExactly(setOutputStub, 'pull', 123);
    const options = createPullRequestStub.firstCall
      .args[2] as codeSuggesterModule.CreatePullRequestUserOptions;
    assert.deepStrictEqual(options.labels, ['foo', 'bar']);
  });
  it('parses default repository', async () => {
    createPullRequestStub.resolves(123);
    await withEnv({
      GITHUB_REPOSITORY: 'testOwner/testRepo',
    }, async () => {
      await withInputs(
        {
          command: 'pr',
          message: 'test message',
          title: 'test title',
          description: 'test description',
          branch: 'test-branch',
          force: 'true',
          fork: 'true',
          maintainers_can_modify: 'true',
        },
        main
      );
    });

    sinon.assert.calledOnceWithMatch(createPullRequestStub);
    sinon.assert.calledOnceWithExactly(setOutputStub, 'pull', 123);
    const options = createPullRequestStub.firstCall
      .args[2] as codeSuggesterModule.CreatePullRequestUserOptions;
    assert.strictEqual(options.upstreamOwner, 'testOwner');
    assert.strictEqual(options.upstreamRepo, 'testRepo');
  });
});

describe('review', () => {
  let reviewPullRequestStub: sinon.SinonStub;
  let setOutputStub: sinon.SinonStub;
  beforeEach(() => {
    reviewPullRequestStub = sandbox.stub(
      codeSuggesterModule,
      'reviewPullRequest'
    );
    setOutputStub = sandbox.stub(core, 'setOutput');
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('parses inputs', async () => {
    reviewPullRequestStub.resolves(234);
    await withInputs(
      {
        command: 'review',
        upstream_owner: 'testOwner',
        upstream_repo: 'testRepo',
        pull_number: '123',
      },
      main
    );

    sinon.assert.calledOnceWithMatch(reviewPullRequestStub);
    sinon.assert.calledOnceWithExactly(setOutputStub, 'review', 234);
    const options = reviewPullRequestStub.firstCall
      .args[2] as codeSuggesterModule.CreateReviewCommentUserOptions;
    assert.strictEqual(options.owner, 'testOwner');
    assert.strictEqual(options.repo, 'testRepo');
    assert.strictEqual(options.pullNumber, 123);
  });
  it('parses default repository', async () => {
    reviewPullRequestStub.resolves(234);
    await withEnv({
      GITHUB_REPOSITORY: 'testOwner/testRepo',
    }, async () => {
      await withInputs(
        {
          command: 'review',
          pull_number: '123',
        },
        main
      );
    });

    sinon.assert.calledOnceWithMatch(reviewPullRequestStub);
    sinon.assert.calledOnceWithExactly(setOutputStub, 'review', 234);
    const options = reviewPullRequestStub.firstCall
      .args[2] as codeSuggesterModule.CreateReviewCommentUserOptions;
    assert.strictEqual(options.owner, 'testOwner');
    assert.strictEqual(options.repo, 'testRepo');
    assert.strictEqual(options.pullNumber, 123);
  });
});

async function withEnv(
  variables: Record<string, string>,
  callback: () => Promise<void>
) {
  const originalEnv = Object.assign({}, process.env);
  try {
    for (const key in variables) {
      process.env[key] = variables[key];
    }
    await callback();
  } finally {
    process.env = originalEnv;
  }
}

async function withInputs(
  inputs: Record<string, string>,
  callback: () => Promise<void>
) {
  const variables: Record<string, string> = {}
  for (const key in inputs) {
    variables['INPUT_' + key.toUpperCase()] = inputs[key];
  }
  await withEnv(variables, callback);
}
