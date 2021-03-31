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
import {describe, it, before, afterEach} from 'mocha';
import {
  GetResponseTypeFromEndpointMethod,
  GetResponseDataTypeFromEndpointMethod,
} from '@octokit/types';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {
  makeInlineSuggestions,
  buildReviewComments,
  PullsCreateReviewParamsComments,
} from '../src/github-handler/comment-handler/make-review-handler/upload-comments-handler';
import {Hunk} from '../src/types';

type GetPullResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.pulls.get
>;

type GetPullResponseData = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.pulls.get
>;

type CreateReviewResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.pulls.createReview
>;

before(() => {
  setup();
});

describe('buildFileComments', () => {
  it('Maps patches to GitHub comment object types', () => {
    const suggestions: Map<string, Hunk[]> = new Map();
    const fileName1 = 'foo.txt';
    const hunk1: Hunk = {
      oldStart: 1,
      oldEnd: 2,
      newStart: 1,
      newEnd: 1,
      newContent: ['Foo'],
    };
    suggestions.set(fileName1, [hunk1]);
    const comments = buildReviewComments(suggestions);
    expect(comments).deep.equals([
      {
        body: '```suggestion\nFoo\n```',
        path: 'foo.txt',
        start_line: 1,
        line: 2,
        side: 'RIGHT',
        start_side: 'RIGHT',
      },
    ]);
  });
  it('Maps multiple patches to GitHub comment object types', () => {
    const suggestions: Map<string, Hunk[]> = new Map();
    const fileName1 = 'foo.txt';
    const fileName2 = 'bar.txt';
    const hunk1: Hunk = {
      oldStart: 1,
      oldEnd: 2,
      newStart: 1,
      newEnd: 2,
      newContent: ['Foo'],
    };
    const hunk2: Hunk = {
      oldStart: 3,
      oldEnd: 4,
      newStart: 3,
      newEnd: 4,
      newContent: ['Bar'],
    };
    suggestions.set(fileName2, [hunk1]);
    suggestions.set(fileName1, [hunk1, hunk2]);
    const comments = buildReviewComments(suggestions);
    expect(comments).deep.equals([
      {
        body: '```suggestion\nFoo\n```',
        path: 'bar.txt',
        start_line: 1,
        line: 2,
        side: 'RIGHT',
        start_side: 'RIGHT',
      },
      {
        body: '```suggestion\nFoo\n```',
        path: 'foo.txt',
        start_line: 1,
        line: 2,
        side: 'RIGHT',
        start_side: 'RIGHT',
      },
      {
        body: '```suggestion\nBar\n```',
        path: 'foo.txt',
        start_line: 3,
        line: 4,
        side: 'RIGHT',
        start_side: 'RIGHT',
      },
    ]);
  });
  it('Maps empty suggestion to empty list', () => {
    const suggestions: Map<string, Hunk[]> = new Map();
    const comments = buildReviewComments(suggestions);
    expect(comments.length).deep.equals(0);
  });
  it('Builds single line comments', () => {
    const suggestions: Map<string, Hunk[]> = new Map();
    const fileName1 = 'foo.txt';
    const hunk1: Hunk = {
      oldStart: 1,
      oldEnd: 1,
      newStart: 1,
      newEnd: 1,
      newContent: ['Foo'],
    };
    suggestions.set(fileName1, [hunk1]);
    const comments = buildReviewComments(suggestions);
    expect(comments).deep.equals([
      {
        body: '```suggestion\nFoo\n```',
        path: 'foo.txt',
        line: 1,
        side: 'RIGHT',
      },
    ]);
  });
});

describe('makeInlineSuggestions', () => {
  const sandbox = sinon.createSandbox();
  const suggestions: Map<string, Hunk[]> = new Map();
  const outOfScopeSuggestions: Map<string, Hunk[]> = new Map();
  afterEach(() => {
    sandbox.restore();
    suggestions.clear();
  });
  const fileName1 = 'foo.txt';
  const hunk1: Hunk = {
    oldStart: 1,
    oldEnd: 2,
    newStart: 1,
    newEnd: 2,
    newContent: ['Foo'],
  };
  const remote = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const pullNumber = 711;
  it("Calls Octokit with the correct values and returns the successfully created review's number", async () => {
    suggestions.set(fileName1, [hunk1]);
    const responseData: GetPullResponseData = ((await import(
      './fixtures/get-pull-request-response.json'
    )) as unknown) as GetPullResponseData;
    const getPullRequestResponse: GetPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: responseData,
    };
    const createReviewResponse: CreateReviewResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: {
        id: 80,
        node_id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3ODA=',
        user: {
          login: 'octocat',
          id: 1,
          node_id: 'MDQ6VXNlcjE=',
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          gravatar_id: '',
          url: 'https://api.github.com/users/octocat',
          html_url: 'https://github.com/octocat',
          followers_url: 'https://api.github.com/users/octocat/followers',
          following_url:
            'https://api.github.com/users/octocat/following{/other_user}',
          gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/octocat/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/octocat/subscriptions',
          organizations_url: 'https://api.github.com/users/octocat/orgs',
          repos_url: 'https://api.github.com/users/octocat/repos',
          events_url: 'https://api.github.com/users/octocat/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/octocat/received_events',
          type: 'User',
          site_admin: false,
        },
        body:
          'This is close to perfect! Please address the suggested inline change.',
        state: 'CHANGES_REQUESTED',
        html_url:
          'https://github.com/octocat/Hello-World/pull/12#pullrequestreview-80',
        pull_request_url:
          'https://api.github.com/repos/octocat/Hello-World/pulls/12',
        _links: {
          html: {
            href:
              'https://github.com/octocat/Hello-World/pull/12#pullrequestreview-80',
          },
          pull_request: {
            href: 'https://api.github.com/repos/octocat/Hello-World/pulls/12',
          },
        },
        submitted_at: '2019-11-17T17:43:43Z',
        commit_id: 'ecdd80bb57125d7ba9641ffaa4d7d2c19d3f3091',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    };
    // setup
    const stubGetPulls = sandbox
      .stub(octokit.pulls, 'get')
      .resolves(getPullRequestResponse);

    const stubCreateReview = sandbox
      .stub(octokit.pulls, 'createReview')
      .resolves(createReviewResponse);
    // tests

    const reivewNumber = await makeInlineSuggestions(
      octokit,
      suggestions,
      outOfScopeSuggestions,
      remote,
      pullNumber
    );
    expect(reivewNumber).equals(80);
    sandbox.assert.calledOnceWithExactly(stubGetPulls, {
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
    });
    sandbox.assert.calledOnceWithExactly(stubCreateReview, {
      owner: remote.owner,
      repo: remote.repo,
      pull_number: pullNumber,
      commit_id: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
      body: '',
      comments: ([
        {
          body: '```suggestion\nFoo\n```',
          path: 'foo.txt',
          start_line: 1,
          line: 2,
          side: 'RIGHT',
          start_side: 'RIGHT',
        },
      ] as unknown) as PullsCreateReviewParamsComments[],
      event: 'COMMENT',
      headers: {accept: 'application/vnd.github.comfort-fade-preview+json'},
    });
  });

  it('Does not create a review when there are no suggestions and no out of scope suggestions generated', async () => {
    const responseData = await import(
      './fixtures/get-pull-request-response.json'
    );
    const getPullRequestResponse: GetPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: (responseData as unknown) as GetPullResponseData,
    };
    // setup
    const stubGetPulls = sandbox
      .stub(octokit.pulls, 'get')
      .resolves(getPullRequestResponse);

    const stubCreateReview = sandbox.stub(octokit.pulls, 'createReview');
    // tests

    await makeInlineSuggestions(
      octokit,
      suggestions,
      outOfScopeSuggestions,
      remote,
      pullNumber
    );
    sandbox.assert.notCalled(stubGetPulls);
    sandbox.assert.notCalled(stubCreateReview);
  });

  it('Returns null when a review is not made', async () => {
    const responseData = await import(
      './fixtures/get-pull-request-response.json'
    );
    const getPullRequestResponse: GetPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: (responseData as unknown) as GetPullResponseData,
    };
    // setup
    const stubGetPulls = sandbox
      .stub(octokit.pulls, 'get')
      .resolves(getPullRequestResponse);

    const stubCreateReview = sandbox.stub(octokit.pulls, 'createReview');
    // tests

    const reviewNumber = await makeInlineSuggestions(
      octokit,
      suggestions,
      outOfScopeSuggestions,
      remote,
      pullNumber
    );
    sandbox.assert.notCalled(stubGetPulls);
    sandbox.assert.notCalled(stubCreateReview);
    expect(reviewNumber).equals(null);
  });

  it('Throws and does not continue when get pull request fails', async () => {
    // setup
    suggestions.set(fileName1, [hunk1]);
    const stubGetPulls = sandbox
      .stub(octokit.pulls, 'get')
      .rejects(new Error());

    const stubCreateReview = sandbox.stub(octokit.pulls, 'createReview');
    // tests
    try {
      await makeInlineSuggestions(
        octokit,
        suggestions,
        outOfScopeSuggestions,
        remote,
        pullNumber
      );
      expect.fail('Should have failed because get pull request failed');
    } catch (err) {
      sandbox.assert.called(stubGetPulls);
      sandbox.assert.notCalled(stubCreateReview);
    }
  });
  it('Throws when create review comments fails', async () => {
    // setup
    suggestions.set(fileName1, [hunk1]);
    const responseData = await import(
      './fixtures/get-pull-request-response.json'
    );
    const getPullRequestResponse: GetPullResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: (responseData as unknown) as GetPullResponseData,
    };
    // setup
    const stubGetPulls = sandbox
      .stub(octokit.pulls, 'get')
      .resolves(getPullRequestResponse);

    const stubCreateReview = sandbox
      .stub(octokit.pulls, 'createReview')
      .rejects(new Error());
    // tests
    try {
      await makeInlineSuggestions(
        octokit,
        suggestions,
        outOfScopeSuggestions,
        remote,
        pullNumber
      );
      expect.fail(
        'Should have failed because create pull request review failed'
      );
    } catch (err) {
      sandbox.assert.called(stubGetPulls);
      sandbox.assert.called(stubCreateReview);
    }
  });
});
