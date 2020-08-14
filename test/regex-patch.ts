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
import {getGitHubPatchRanges} from '../src/github-handler/comment-handler/diff-text-handler';

describe('Getting patch range from patch text', async () => {
  describe('GitHub patch text', () => {
    const gitHubListFilesData = [
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
    ];
    it('parses original text for multiline modifies', () => {
      const patch = gitHubListFilesData[0];
      const ranges = getGitHubPatchRanges(patch.patch);
      expect(ranges[0].start).equals(1);
      expect(ranges[0].end).equals(6);
    });
    it('parses original text for single line modifies at the start of the file', () => {
      const patch = gitHubListFilesData[1];
      const ranges = getGitHubPatchRanges(patch.patch);
      expect(ranges[0].start).equals(1);
      expect(ranges[0].end).equals(2);
    });
    it('parses original text for single line deletes', () => {
      const patch = gitHubListFilesData[2];
      const ranges = getGitHubPatchRanges(patch.patch);
      expect(ranges[0].start).equals(0);
      expect(ranges[0].end).equals(0);
    });
  });
});
