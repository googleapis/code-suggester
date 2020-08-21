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

import {describe, it, before, afterEach} from 'mocha';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {makeTimeLineComment} from '../src/github-handler/comment-handler/invalid-hunk-handler';
import {Hunk} from '../src/types';

before(() => {
  setup();
});

describe('makeTimeLineComment', () => {
  const sandbox = sinon.createSandbox();
  const remote = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const pullNumber = 711;
  afterEach(() => {
    sandbox.restore();
  });
  it('Invokes the octokit create issues comment when there are invalid hunks', async () => {
    const invalidHunks: Map<string, Hunk[]> = new Map();
    const fileName1 = 'foo.txt';
    const hunk1: Hunk = {
      oldStart: 1,
      oldEnd: 2,
      newStart: 1,
      newEnd: 2,
    };
    invalidHunks.set(fileName1, [hunk1]);
    const stubGetPulls = sandbox.stub(octokit.issues, 'createComment');
    await makeTimeLineComment(octokit, invalidHunks, remote, pullNumber);
    sandbox.assert.called(stubGetPulls);
  });
  it('Does not invoke the octokit create issues comment when there are no invalid hunks', async () => {
    const invalidHunks: Map<string, Hunk[]> = new Map();
    const stubGetPulls = sandbox.stub(octokit.issues, 'createComment');
    await makeTimeLineComment(octokit, invalidHunks, remote, pullNumber);
    sandbox.assert.notCalled(stubGetPulls);
  });
});
