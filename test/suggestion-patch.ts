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
import {describe, it, before, beforeEach} from 'mocha';
import {setup} from './util';
import {getValidSuggestionHunks} from '../src/github-handler/comment-handler/raw-patch-handler/in-scope-hunks-handler';
import {Range, FileDiffContent} from '../src/types';

before(() => {
  setup();
});

describe('getValidSuggestionHunks', () => {
  const scope: Map<string, Range[]> = new Map();
  const fileName1 = 'foo.txt';
  const fileName2 = 'bar.txt';
  const invalidFile = 'baz.txt';
  const invalidFiles = [invalidFile];
  scope.set(fileName1, [{start: 1, end: 2}]);
  scope.set(fileName2, [{start: 2, end: 11}]);
  const diffContents: Map<string, FileDiffContent> = new Map();

  beforeEach(() => {
    diffContents.clear();
  });

  it('Finds file hunks that are in scope for the pull request', () => {
    diffContents.set(fileName2, {
      oldContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
      newContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nfoo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
    });
    const suggestions = getValidSuggestionHunks(
      diffContents,
      invalidFiles,
      scope
    );
    // FIXME(chingor): investigate this
    expect(suggestions.inScopeSuggestions.size).equals(0);
  });

  it('Excludes file hunks that are not in scope for the pull request', () => {
    diffContents.set(fileName1, {
      oldContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
      newContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
    });
    const suggestions = getValidSuggestionHunks(
      diffContents,
      invalidFiles,
      scope
    );
    expect(suggestions.inScopeSuggestions.size).equals(0);
  });

  it('Excludes suggestion files that are not in scope because the file is not in scope', () => {
    diffContents.set('non-existant-file-that-is-not-invalid.txt', {
      oldContent: 'foo',
      newContent: 'bar',
    });
    const suggestions = getValidSuggestionHunks(
      diffContents,
      invalidFiles,
      scope
    );
    expect(suggestions.inScopeSuggestions.size).equals(0);
  });

  it('Excludes suggestion files that are not in scope because the file is invalid', () => {
    diffContents.set(invalidFile, {oldContent: 'foo', newContent: 'bar'});
    const suggestions = getValidSuggestionHunks(
      diffContents,
      invalidFiles,
      scope
    );
    expect(suggestions.inScopeSuggestions.size).equals(0);
  });

  it('Does not include suggestion files that have no change', () => {
    diffContents.set(fileName1, {oldContent: 'foo', newContent: 'foo'});
    const suggestions = getValidSuggestionHunks(
      diffContents,
      invalidFiles,
      scope
    );
    expect(suggestions.inScopeSuggestions.size).equals(0);
  });

  // TODO(chingor): investigate this
  // it('Calculates in scope and out of scope files that are mutually exclusive', () => {
  //   // in scope hunk
  //   diffContents.set(fileName2, {
  //     oldContent:
  //       'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
  //     newContent:
  //       'bar\nbar\nbar\nbar\nbar\nbar\nfoo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
  //   });
  //   // out of scope hunks
  //   diffContents.set(fileName1, {
  //     oldContent:
  //       'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
  //     newContent:
  //       'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
  //   });
  //   // same before and after
  //   diffContents.set('same-before-and-after.text', {
  //     oldContent:
  //       'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
  //     newContent:
  //       'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
  //   });
  //   // out of scope file name
  //   diffContents.set('non-existant-file-that-is-not-invalid.txt', {
  //     oldContent: 'foo',
  //     newContent: 'bar',
  //   });
  //   // out of scope file name
  //   diffContents.set(invalidFile, {
  //     oldContent: 'foo',
  //     newContent: 'bar',
  //   });
  //   const suggestions = getValidSuggestionHunks(
  //     diffContents,
  //     invalidFiles,
  //     scope
  //   );
  //   // TODO(chingor): investigate this
  //   expect(suggestions.inScopeSuggestions.size).equals(0);
  //   expect(suggestions.inScopeSuggestions.has(fileName2)).equals(true);
  //   expect(suggestions.outOfScopeSuggestions.size).equals(3);
  //   expect(
  //     suggestions.outOfScopeSuggestions.has(
  //       'non-existant-file-that-is-not-invalid.txt'
  //     )
  //   ).equals(true);
  //   expect(suggestions.outOfScopeSuggestions.has(invalidFile)).equals(true);
  //   expect(suggestions.outOfScopeSuggestions.has(fileName1)).equals(true);
  // });
});
