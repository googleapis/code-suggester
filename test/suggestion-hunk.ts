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
import {getRawSuggestionHunks} from '../src/utils/hunk-utils';
import {FileDiffContent} from '../src/types';

before(() => {
  setup();
});

describe('getRawSuggestionHunks', () => {
  const diffContents: Map<string, FileDiffContent> = new Map();
  const fileDiffContent1: FileDiffContent = {
    oldContent: 'foo',
    newContent: 'FOO',
  };
  const fileDiffContent2: FileDiffContent = {
    oldContent:
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
    newContent:
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
  };
  const fileName1 = 'README.md';
  const fileName2 = 'bars.txt';
  diffContents.set(fileName1, fileDiffContent1);
  diffContents.set(fileName2, fileDiffContent2);

  it("Does not update the user's input of text file diff contents", () => {
    getRawSuggestionHunks(diffContents);
    assert.strictEqual(fileDiffContent1.oldContent, 'foo');
    assert.strictEqual(fileDiffContent1.newContent, 'FOO');
    assert.strictEqual(diffContents.get(fileName1)!.oldContent, 'foo');
    assert.strictEqual(diffContents.get(fileName1)!.newContent, 'FOO');
    assert.strictEqual(
      fileDiffContent2.oldContent,
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar'
    );
    assert.strictEqual(
      fileDiffContent2.newContent,
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo'
    );
    assert.strictEqual(
      diffContents.get(fileName2)!.oldContent,
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar'
    );
    assert.strictEqual(
      diffContents.get(fileName2)!.newContent,
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo'
    );
  });

  it('Generates the hunks that are produced by the diff library for all files that are updated', () => {
    const fileHunks = getRawSuggestionHunks(diffContents);
    assert.strictEqual(fileHunks.size, 2);
    assert.strictEqual(fileHunks.get(fileName1)!.length, 1);
    assert.strictEqual(fileHunks.get(fileName1)![0].oldStart, 1);
    assert.strictEqual(fileHunks.get(fileName1)![0].oldEnd, 1);
    assert.strictEqual(fileHunks.get(fileName1)![0].newStart, 1);
    assert.strictEqual(fileHunks.get(fileName1)![0].newEnd, 1);
    assert.strictEqual(fileHunks.get(fileName2)!.length, 2);
    assert.strictEqual(fileHunks.get(fileName2)![0].oldStart, 1);
    // FIXME: See #126
    assert.strictEqual(fileHunks.get(fileName2)![0].oldEnd, 0);
    assert.strictEqual(fileHunks.get(fileName2)![0].newStart, 1);
    assert.strictEqual(fileHunks.get(fileName2)![0].newEnd, 1);
    assert.strictEqual(fileHunks.get(fileName2)![1].oldStart, 16);
    assert.strictEqual(fileHunks.get(fileName2)![1].oldEnd, 16);
    assert.strictEqual(fileHunks.get(fileName2)![1].newStart, 17);
    assert.strictEqual(fileHunks.get(fileName2)![1].newEnd, 18);
  });

  it('Does not generate hunks for changes that contain no updates', () => {
    const samediffContents = new Map();
    samediffContents.set('unchanged-1.txt', {oldContent: '', newContent: ''});
    samediffContents.set('unchanged-2.txt', {
      oldContent: 'same',
      newContent: 'same',
    });
    const fileHunks = getRawSuggestionHunks(samediffContents);
    assert.strictEqual(fileHunks.size, 0);
  });
});
