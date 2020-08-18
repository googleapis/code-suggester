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
import {setup} from './util';
import * as sinon from 'sinon';
import {
  patchTextToRanges,
  getCurrentPullRequestPatches,
  getPullRequestScope,
} from '../src/github-handler/comment-handler/remote-patch-ranges-handler';
import {Octokit} from '@octokit/rest';
import {logger} from '../src/logger';

before(() => {
  setup();
});

describe('getCurrentPullRequestPatches', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const pullNumber = 10;
  const pageSize = 80;
  const octokit = new Octokit({});

  it('Calls Octokit with the correct values', async () => {
    // setup
    const listFilesOfPRResult = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch:
            '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World',
        },
      ],
    };
    const stub = sandbox
      .stub(octokit.pulls, 'listFiles')
      .resolves(listFilesOfPRResult);

    // tests
    await getCurrentPullRequestPatches(octokit, upstream, pullNumber, pageSize);
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: upstream.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    });
  });
  it('Returns all the valid patches', async () => {
    // setup
    const listFilesOfPRResult = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch:
            '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World',
        },
        {
          sha: '8b137891791fe96927ad78e64b0aad7bded08bdc',
          filename: 'foo/foo.txt',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/foo/foo.txt',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/foo/foo.txt',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/foo/foo.txt?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch: '@@ -1 +1 @@\n-Hello foo\n+',
        },
        {
          sha: '3b18e512dba79e4c8300dd08aeb37f8e728b8dad',
          filename: 'helloworld.txt',
          status: 'removed',
          additions: 0,
          deletions: 1,
          changes: 1,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/f5da827a725a701302da7db2da16b1678f52fdcc/helloworld.txt',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/f5da827a725a701302da7db2da16b1678f52fdcc/helloworld.txt',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/helloworld.txt?ref=f5da827a725a701302da7db2da16b1678f52fdcc',
          patch: '@@ -1 +0,0 @@\n-hello world',
        },
      ],
    };
    sandbox.stub(octokit.pulls, 'listFiles').resolves(listFilesOfPRResult);

    // tests
    const {patches, filesMissingPatch} = await getCurrentPullRequestPatches(
      octokit,
      upstream,
      pullNumber,
      pageSize
    );
    expect(patches.size).equals(3);
    expect(patches.get(listFilesOfPRResult.data[0].filename)).equals(
      '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World'
    );
    expect(patches.get(listFilesOfPRResult.data[1].filename)).equals(
      '@@ -1 +1 @@\n-Hello foo\n+'
    );
    expect(patches.get(listFilesOfPRResult.data[2].filename)).equals(
      '@@ -1 +0,0 @@\n-hello world'
    );
    expect(filesMissingPatch.length).equals(0);
  });
  it('Passes the error message up from octokit when octokit fails', async () => {
    // setup
    const errorMsg = 'Error message';
    sandbox.stub(octokit.pulls, 'listFiles').rejects(Error(errorMsg));
    try {
      await getCurrentPullRequestPatches(
        octokit,
        upstream,
        pullNumber,
        pageSize
      );
      expect.fail(
        'The getCurrentPulLRequestPatches function should have failed because Octokit failed.'
      );
    } catch (err) {
      expect(err.message).to.equal(errorMsg);
    }
  });
  it('Throws when there is no list file data returned from octokit', async () => {
    // setup
    const listFilesOfPRResult = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [],
    };
    sandbox.stub(octokit.pulls, 'listFiles').resolves(listFilesOfPRResult);
    try {
      await getCurrentPullRequestPatches(
        octokit,
        upstream,
        pullNumber,
        pageSize
      );
      expect.fail(
        'The getCurrentPulLRequestPatches function should have failed because Octokit failed.'
      );
    } catch (err) {
      expect(err.message).to.equal('Empty Pull Request');
    }
  });
  it('Does not error when there is list file data but no patch data', async () => {
    // setup
    const listFilesOfPRResult = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
        },
      ],
    };

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    // these are real results from calling listFiles API and are a valid GitHub return type, but octokit type definition says otherwise
    // cannot force another type cast since the GitHub API return types are not importable
    // unknown type cast not allowed
    const stub = sandbox
      .stub(logger, 'warn')
      .resolves(listFilesOfPRResult as any);
    sandbox
      .stub(octokit.pulls, 'listFiles')
      .resolves(listFilesOfPRResult as any);

    // tests
    const {filesMissingPatch} = await getCurrentPullRequestPatches(
      octokit,
      upstream,
      pullNumber,
      pageSize
    );
    sandbox.assert.called(stub);
    expect(filesMissingPatch.length).equals(1);
    expect(filesMissingPatch[0]).equals('Readme.md');
  });
});

describe('patchTextToRanges', () => {
  it('Returns an empty range file record when there is no patch text', () => {
    const patchText = new Map<string, string>();
    const ranges = patchTextToRanges(patchText);
    expect(ranges.size).equals(0);
  });
  it('Does not throw an error when the patch text is an empty string and does not add the patch to the valid range map', () => {
    const patchText = new Map<string, string>();
    patchText.set('invalid-patch.txt', '');
    const ranges = patchTextToRanges(patchText);
    expect(ranges.get('invalid-patch.txt')).equals(undefined);
  });
  it('Does not throw an error when the patch text is a string that does not contain patch data add the patch to the valid range map', () => {
    const patchText = new Map<string, string>();
    patchText.set('invalid-patch.txt', '@@ this is some invalid patch data @@');
    const ranges = patchTextToRanges(patchText);
    expect(ranges.get('invalid-patch.txt')).equals(undefined);
  });
  it('Calculates ranges with an inclusive lower bound and an exclusive upper bound', () => {
    const multilinePatch =
      '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World';
    const multilineFileName = 'multi-line-patch.txt';
    const firstLinePatch = "@@ -0,0 +1 @@\n+console.log('Hello World!');";
    const multiToSingleLineFileName = 'multi-to-single-line-patch.txt';
    const patchText = new Map<string, string>();
    patchText.set(multilineFileName, multilinePatch);
    patchText.set(multiToSingleLineFileName, firstLinePatch);
    const ranges = patchTextToRanges(patchText);
    expect(ranges.get(multilineFileName)).not.equals(null);
    expect(ranges.get(multilineFileName)?.length).equals(1);
    expect(ranges.get(multilineFileName)![0].start).equals(1);
    expect(ranges.get(multilineFileName)![0].end).not.equals(5);
    expect(ranges.get(multilineFileName)![0].end).equals(6);
    expect(ranges.get(multiToSingleLineFileName)).not.equals(null);
    expect(ranges.get(multiToSingleLineFileName)?.length).equals(1);
    expect(ranges.get(multiToSingleLineFileName)![0].start).equals(1);
    expect(ranges.get(multiToSingleLineFileName)![0].end).not.equals(1);
    expect(ranges.get(multiToSingleLineFileName)![0].end).equals(2);
  });
  it('Returns a single range file record when there is a single multiline patch hunk', () => {
    const multilinePatch =
      '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World';
    const multilineFileName = 'multi-line-patch.txt';
    const patchText = new Map<string, string>();
    patchText.set(multilineFileName, multilinePatch);
    const ranges = patchTextToRanges(patchText);
    expect(ranges.size).equals(1);
    expect(ranges.get(multilineFileName)).not.equals(null);
    expect(ranges.get(multilineFileName)?.length).equals(1);
    expect(ranges.get(multilineFileName)![0].start).equals(1);
    expect(ranges.get(multilineFileName)![0].end).equals(6);
  });
  it('Returns a single range file record when there is a single 1 line patch hunk', () => {
    const firstLinePatch = '@@ -1 +1 @@\n-Hello foo\n+';
    const singlelineFIleName = 'single-line-patch.txt';
    const patchText = new Map<string, string>();
    patchText.set(singlelineFIleName, firstLinePatch);
    const ranges = patchTextToRanges(patchText);
    expect(ranges.size).equals(1);
    expect(ranges.get(singlelineFIleName)).not.equals(null);
    expect(ranges.get(singlelineFIleName)?.length).equals(1);
    expect(ranges.get(singlelineFIleName)![0].start).equals(1);
    expect(ranges.get(singlelineFIleName)![0].end).equals(2);
  });
  it('Returns a single range file record when there is a single 1 line to multiline line patch hunk', () => {
    const singleToMultilineFormat = '@@ -1 +0,0 @@\n-hello world';
    const singleToMultilineFileName = 'single-line-to-multiline-patch.txt';
    const patchText = new Map<string, string>();
    patchText.set(singleToMultilineFileName, singleToMultilineFormat);
    const ranges = patchTextToRanges(patchText);
    expect(ranges.size).equals(1);
    expect(ranges.get(singleToMultilineFileName)).not.equals(null);
    expect(ranges.get(singleToMultilineFileName)?.length).equals(1);
    expect(ranges.get(singleToMultilineFileName)![0].start).equals(0);
    expect(ranges.get(singleToMultilineFileName)![0].end).equals(0);
  });
  it('Returns a single range file record when there is a single multiline to 1 line patch hunk', () => {
    const firstLinePatch = "@@ -0,0 +1 @@\n+console.log('Hello World!');";
    const multiToSingleLineFileName = 'multi-to-single-line-patch.txt';
    const patchText = new Map<string, string>();
    patchText.set(multiToSingleLineFileName, firstLinePatch);
    const ranges = patchTextToRanges(patchText);
    expect(ranges.size).equals(1);
    expect(ranges.get(multiToSingleLineFileName)).not.equals(null);
    expect(ranges.get(multiToSingleLineFileName)?.length).equals(1);
    expect(ranges.get(multiToSingleLineFileName)![0].start).equals(1);
    expect(ranges.get(multiToSingleLineFileName)![0].end).equals(2);
  });
  it('Returns a single range file record when there is a single multiline to 1 line patch hunk', () => {
    const multiplePatches =
      '@@ -356,6 +356,7 @@ Hello\n Hello\n Hello\n Hello\n+Bye\n Hello\n Hello\n Hello\n@@ -6576,8 +6577,7 @@ Hello\n Hello\n Hello\n Hello\n-Hello\n-Hello\n+Bye\n Hello\n Hello\n Hello';
    const multiplePatchesFileName = 'multiple-patches.txt';
    const patchText = new Map<string, string>();
    patchText.set(multiplePatchesFileName, multiplePatches);
    const ranges = patchTextToRanges(patchText);
    expect(ranges.size).equals(1);
    expect(ranges.get(multiplePatchesFileName)).not.equals(null);
    expect(ranges.get(multiplePatchesFileName)?.length).equals(2);
    expect(ranges.get(multiplePatchesFileName)![0].start).equals(356);
    expect(ranges.get(multiplePatchesFileName)![0].end).equals(363);
    expect(ranges.get(multiplePatchesFileName)![1].start).equals(6577);
    expect(ranges.get(multiplePatchesFileName)![1].end).equals(6584);
  });
});

describe('getPullRequestScope', () => {
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const pullNumber = 10;
  const pageSize = 80;
  const octokit = new Octokit({});
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('Returns the correct values when octokit and patch text parsing function execute properly', async () => {
    // setup
    const listFilesOfPRResult = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: [
        {
          sha: 'a1d470fa4d7b04450715e3e02d240a34517cd988',
          filename: 'Readme.md',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
          blob_url:
            'https://github.com/TomKristie/HelloWorld/blob/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          raw_url:
            'https://github.com/TomKristie/HelloWorld/raw/eb53f3871f56e8dd6321e44621fe6ac2da1bc120/Readme.md',
          contents_url:
            'https://api.github.com/repos/TomKristie/HelloWorld/contents/Readme.md?ref=eb53f3871f56e8dd6321e44621fe6ac2da1bc120',
          patch:
            '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World',
        },
      ],
    };
    const stub = sandbox
      .stub(octokit.pulls, 'listFiles')
      .resolves(listFilesOfPRResult);

    // tests
    const {
      validFileLines,
      invalidFiles: filesMissingPatch,
    } = await getPullRequestScope(octokit, upstream, pullNumber, pageSize);
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: upstream.repo,
      pull_number: pullNumber,
      per_page: pageSize,
    });
    expect(validFileLines.size).equals(1);
    expect(validFileLines.get('Readme.md')).not.equals(null);
    expect(validFileLines.get('Readme.md')?.length).equals(1);
    expect(validFileLines.get('Readme.md')![0].start).equals(1);
    expect(validFileLines.get('Readme.md')![0].end).equals(6);
    expect(filesMissingPatch.length).equals(0);
  });

  it('Passes up the error when a sub-method fails', async () => {
    // setup
    const errorMsg = 'Test error for list files';
    sandbox.stub(octokit.pulls, 'listFiles').rejects(new Error(errorMsg));

    // tests
    try {
      await getPullRequestScope(octokit, upstream, pullNumber, pageSize);
      expect.fail(
        'The getPullRequestScope function should have failed because Octokit failed.'
      );
    } catch (err) {
      expect(err.message).equals(errorMsg);
    }
  });
});
