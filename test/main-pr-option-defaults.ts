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

import * as assert from 'assert';
import {describe, it, before} from 'mocha';
import {setup} from './util';
import {
  CreatePullRequestUserOptions,
  CreateReviewCommentUserOptions,
} from '../src/types';
import {
  addPullRequestDefaults,
  addReviewCommentsDefaults,
} from '../src/default-options-handler';

before(() => {
  setup();
});

describe('addPullRequestDefaults', () => {
  it('Populates all un-specified parameters with a default', () => {
    const upstreamOnly: CreatePullRequestUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      description: 'custom description',
      title: 'chore: custom title',
      message: 'chore: custom description',
    };
    const gitHubPr1 = addPullRequestDefaults(upstreamOnly);
    assert.deepStrictEqual(gitHubPr1, {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'code-suggestions',
      force: false,
      description: 'custom description',
      title: 'chore: custom title',
      message: 'chore: custom description',
      primary: 'main',
      maintainersCanModify: true,
    });
    const upstreamAndPrimary: CreatePullRequestUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      primary: 'non-default-primary-branch',
      description: 'custom description',
      title: 'chore: custom title',
      message: 'chore: custom description',
    };
    const gitHubPr2 = addPullRequestDefaults(upstreamAndPrimary);
    assert.deepStrictEqual(gitHubPr2, {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'code-suggestions',
      force: false,
      description: 'custom description',
      title: 'chore: custom title',
      message: 'chore: custom description',
      primary: 'non-default-primary-branch',
      maintainersCanModify: true,
    });
    const upstreamAndPrDescription: CreatePullRequestUserOptions = {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      description: 'Non-default PR description',
      title: 'chore: code suggestions non-default PR ttile',
      message: 'chore: custom code suggestions message',
    };
    const gitHubPr3 = addPullRequestDefaults(upstreamAndPrDescription);
    assert.deepStrictEqual(gitHubPr3, {
      upstreamOwner: 'owner',
      upstreamRepo: 'repo',
      branch: 'code-suggestions',
      description: 'Non-default PR description',
      title: 'chore: code suggestions non-default PR ttile',
      force: false,
      message: 'chore: custom code suggestions message',
      primary: 'main',
      maintainersCanModify: true,
    });
  });
  it("Uses all of user's provided options", () => {
    const options: CreatePullRequestUserOptions = {
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
    const gitHubPr = addPullRequestDefaults(options);
    assert.deepStrictEqual(gitHubPr, options);
  });
});

describe('addReviewCommentsDefaults', () => {
  it('Populates all un-specified parameters with a default', () => {
    const reviewOptionsWithDefaultPageSize: CreateReviewCommentUserOptions = {
      owner: 'owner',
      repo: 'repo',
      pullNumber: 12345678,
    };
    const gitHubPrReview = addReviewCommentsDefaults(
      reviewOptionsWithDefaultPageSize
    );
    assert.deepStrictEqual(gitHubPrReview, {
      owner: 'owner',
      repo: 'repo',
      pullNumber: 12345678,
      pageSize: 100,
    });
  });
  it("Uses all of user's provided options", () => {
    const reviewOptions: CreateReviewCommentUserOptions = {
      owner: 'owner',
      repo: 'repo',
      pullNumber: 12345678,
      pageSize: 4321,
    };
    const gitHubPrReview = addReviewCommentsDefaults(reviewOptions);
    assert.deepStrictEqual(gitHubPrReview, reviewOptions);
  });
});
