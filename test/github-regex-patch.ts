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
import {describe, it} from 'mocha';
import {getGitHubPatchRanges} from '../src/github-handler/comment-handler/get-hunk-scope-handler/github-patch-text-handler';
import {PatchSyntaxError} from '../src/types';

describe('Getting patch range from GitHub patch text', async () => {
  it('parses original text for multiline modifies', () => {
    const multilinePatch =
      '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World';
    const ranges = getGitHubPatchRanges(multilinePatch);
    expect(ranges[0].start).equals(1);
    expect(ranges[0].end).equals(6);
    expect(ranges.length).equals(1);
  });
  it('parses original text for single line modifies at the start of the file', () => {
    const firstLinePatch = '@@ -1 +1 @@\n-Hello foo\n+';
    const ranges = getGitHubPatchRanges(firstLinePatch);
    expect(ranges[0].start).equals(1);
    expect(ranges[0].end).equals(2);
    expect(ranges.length).equals(1);
  });
  it('parses original text for single line deletes', () => {
    const singleLineToMultilineFormat = '@@ -1 +0,0 @@\n-hello world';
    const ranges = getGitHubPatchRanges(singleLineToMultilineFormat);
    expect(ranges[0].start).equals(0);
    expect(ranges[0].end).equals(0);
    expect(ranges.length).equals(1);
  });
  it('parses original text for single line file creations', () => {
    const firstLinePatch = "@@ -0,0 +1 @@\n+console.log('Hello World!');";
    const ranges = getGitHubPatchRanges(firstLinePatch);
    expect(ranges[0].start).equals(1);
    expect(ranges[0].end).equals(2);
    expect(ranges.length).equals(1);
  });
  it('parses patch text with multiple patches', () => {
    const multiplePatch =
      '@@ -356,6 +356,7 @@ Hello\n Hello\n Hello\n Hello\n+Bye\n Hello\n Hello\n Hello\n@@ -6576,8 +6577,7 @@ Hello\n Hello\n Hello\n Hello\n-Hello\n-Hello\n+Bye\n Hello\n Hello\n Hello';
    const ranges = getGitHubPatchRanges(multiplePatch);
    expect(ranges[0].start).equals(356);
    expect(ranges[0].end).equals(363);
    expect(ranges[1].start).equals(6577);
    expect(ranges[1].end).equals(6584);
    expect(ranges.length).equals(2);
  });
  it('throws an error when the patch text is null', () => {
    const patch = (null as unknown) as string;
    try {
      getGitHubPatchRanges(patch);
      expect.fail('Should have filed because an invalid input was given');
    } catch (err) {
      expect(err instanceof TypeError).equals(true);
    }
  });
  it('throws an error when the patch text is undefined', () => {
    const patch = (undefined as unknown) as string;
    try {
      getGitHubPatchRanges(patch);
      expect.fail('Should have filed because an invalid input was given');
    } catch (err) {
      expect(err instanceof TypeError).equals(true);
    }
  });
  it('throws an error when the patch text does not contain hunk ranges and contains other text', () => {
    const patch = '@ 1 1 @ invalid patch because it needs a + and - sign';
    try {
      getGitHubPatchRanges(patch);
      expect.fail('Should have filed because an invalid input was given');
    } catch (err) {
      expect(err instanceof PatchSyntaxError).equals(true);
    }
  });
  it('throws an error when the patch text does not contain hunk ranges because it is an empty string', () => {
    const patch = '';
    try {
      getGitHubPatchRanges(patch);
      expect.fail('Should have filed because an invalid input was given');
    } catch (err) {
      expect(err instanceof PatchSyntaxError).equals(true);
    }
  });
});
