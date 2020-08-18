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
import {getValidSuggestionHunks} from '../src/github-handler/comment-handler/suggestion-patch-handler';
import {FileRanges, RawChanges} from '../src/types';

before(() => {
  setup();
});

describe('getValidSuggestionHunks', () => {
  const scope: FileRanges = new Map();
  const fileName1 = 'foo.txt';
  const fileName2 = 'bar.txt';
  const invalidFile = 'baz.txt';
  const invalidFiles = [invalidFile];
  scope.set(fileName1, [{start: 1, end: 2}]);
  scope.set(fileName2, [{start: 2, end: 11}]);
  const rawChanges: RawChanges = new Map();

  beforeEach(() => {
    rawChanges.clear();
  });

  it('Keeps file hunks that are in scope for the pull request', () => {
    rawChanges.set(fileName2, {
      oldContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
      newContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nfoo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
    });
    const suggestions = getValidSuggestionHunks(
      rawChanges,
      invalidFiles,
      scope
    );
    expect(suggestions.size).equals(1);
  });

  it('Removes file hunks that are not in scope for the pull request', () => {
    rawChanges.set(fileName1, {
      oldContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
      newContent:
        'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
    });
    const suggestions = getValidSuggestionHunks(
      rawChanges,
      invalidFiles,
      scope
    );
    expect(suggestions.size).equals(0);
  });

  it('Removes suggestion files that are not in scope because the file is not in scope', () => {
    rawChanges.set('non-existant-file-that-is-not-invalid.txt', {
      oldContent: 'foo',
      newContent: 'bar',
    });
    const suggestions = getValidSuggestionHunks(
      rawChanges,
      invalidFiles,
      scope
    );
    expect(suggestions.size).equals(0);
  });

  it('Removes suggestion files that are not in scope because the file is invalid', () => {
    rawChanges.set(invalidFile, {oldContent: 'foo', newContent: 'bar'});
    const suggestions = getValidSuggestionHunks(
      rawChanges,
      invalidFiles,
      scope
    );
    expect(suggestions.size).equals(0);
  });

  it('Removes suggestion files that have no change', () => {
    rawChanges.set(fileName1, {oldContent: 'foo', newContent: 'foo'});
    const suggestions = getValidSuggestionHunks(
      rawChanges,
      invalidFiles,
      scope
    );
    expect(suggestions.size).equals(0);
  });
});
