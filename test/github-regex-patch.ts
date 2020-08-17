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
import {getGitHubPatchRanges} from '../src/github-handler/comment-handler/github-patch-format-handler';

describe('Getting patch range from GitHub patch text', async () => {
  it('parses original text for multiline modifies', () => {
    const multiline_patch =
      '@@ -1,2 +1,5 @@\n Hello world\n-!\n+Goodbye World\n+gOodBYE world\n+\n+Goodbye World';
    const ranges = getGitHubPatchRanges(multiline_patch);
    expect(ranges[0].start).equals(1);
    expect(ranges[0].end).equals(6);
    expect(ranges.length).equals(1);
  });
  it('parses original text for single line modifies at the start of the file', () => {
    const first_line_patch = '@@ -1 +1 @@\n-Hello foo\n+';
    const ranges = getGitHubPatchRanges(first_line_patch);
    expect(ranges[0].start).equals(1);
    expect(ranges[0].end).equals(2);
    expect(ranges.length).equals(1);
  });
  it('parses original text for single line deletes', () => {
    const single_line_to_multiline_format = '@@ -1 +0,0 @@\n-hello world';
    const ranges = getGitHubPatchRanges(single_line_to_multiline_format);
    expect(ranges[0].start).equals(0);
    expect(ranges[0].end).equals(0);
    expect(ranges.length).equals(1);
  });
  it('parses original text for single line file creations', () => {
    const first_line_patch = "@@ -0,0 +1 @@\n+console.log('Hello World!');";
    const ranges = getGitHubPatchRanges(first_line_patch);
    expect(ranges[0].start).equals(1);
    expect(ranges[0].end).equals(2);
    expect(ranges.length).equals(1);
  });
  it('parses patch text with multiple patches', () => {
    const first_line_patch =
      '@@ -356,6 +356,7 @@ Hello\n Hello\n Hello\n Hello\n+Bye\n Hello\n Hello\n Hello\n@@ -6576,8 +6577,7 @@ Hello\n Hello\n Hello\n Hello\n-Hello\n-Hello\n+Bye\n Hello\n Hello\n Hello';
    const ranges = getGitHubPatchRanges(first_line_patch);
    expect(ranges[0].start).equals(356);
    expect(ranges[0].end).equals(363);
    expect(ranges[1].start).equals(6577);
    expect(ranges[1].end).equals(6584);
    expect(ranges.length).equals(2);
  });
});
