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
import {setup} from './util';
import {GitHubPrUserOptions} from '../src/types';
import {addPrOptionDefaults} from '../src/default-options-handler';

before(() => {
  setup();
});

describe('Create with defaults', () => {
  it('Populates all un-specified parameters with a default', () => {
    const upstreamOnly: GitHubPrUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
    };
    const gitHubPr1 = addPrOptionDefaults(upstreamOnly);
    expect(gitHubPr1).to.deep.equal({
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'code-suggestions',
      description: 'code suggestions',
      title: 'chore: code suggestions',
      force: false,
      message: 'chore: code suggestions',
      primary: 'master',
      maintainersCanModify: true,
    });
    const upstreamAndPrimary: GitHubPrUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      primary: 'non-default-primary-branch',
    };
    const gitHubPr2 = addPrOptionDefaults(upstreamAndPrimary);
    expect(gitHubPr2).to.deep.equal({
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'code-suggestions',
      description: 'code suggestions',
      title: 'chore: code suggestions',
      force: false,
      message: 'chore: code suggestions',
      primary: 'non-default-primary-branch',
      maintainersCanModify: true,
    });
    const upstreamAndPrDescription: GitHubPrUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      description: 'Non-default PR description',
      title: 'chore: code suggestions non-default PR ttile',
    };
    const gitHubPr3 = addPrOptionDefaults(upstreamAndPrDescription);
    expect(gitHubPr3).to.deep.equal({
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'code-suggestions',
      description: 'Non-default PR description',
      title: 'chore: code suggestions non-default PR ttile',
      force: false,
      message: 'chore: code suggestions',
      primary: 'master',
      maintainersCanModify: true,
    });
  });
  it("Uses all of user's provided options", () => {
    const options: GitHubPrUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'custom-code-suggestion-branch',
      description: 'The PR will use this description',
      title: 'chore: code suggestions custom PR title',
      force: true,
      message: 'chore: code suggestions custom commit message',
      primary: 'non-default-primary-branch',
      maintainersCanModify: false,
    };
    const gitHubPr = addPrOptionDefaults(options);
    expect(gitHubPr).to.deep.equal(options);
  });
});
