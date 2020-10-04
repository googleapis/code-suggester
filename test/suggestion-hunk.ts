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
import {getRawSuggestionHunks} from '../src/github-handler/comment-handler/raw-patch-handler/raw-hunk-handler';
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
    expect(fileDiffContent1.oldContent).equals('foo');
    expect(fileDiffContent1.newContent).equals('FOO');
    expect(diffContents.get(fileName1)!.oldContent).equals('foo');
    expect(diffContents.get(fileName1)!.newContent).equals('FOO');
    expect(fileDiffContent2.oldContent).equals(
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar'
    );
    expect(fileDiffContent2.newContent).equals(
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo'
    );
    expect(diffContents.get(fileName2)!.oldContent).equals(
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar'
    );
    expect(diffContents.get(fileName2)!.newContent).equals(
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo'
    );
  });

  it('Generates the hunks that are produced by the diff library for all files that are updated', () => {
    const fileHunks = getRawSuggestionHunks(diffContents);
    expect(fileHunks.size).equals(2);
    expect(fileHunks.get(fileName1)!.length).equals(1);
    expect(fileHunks.get(fileName1)![0].oldStart).equals(1);
    expect(fileHunks.get(fileName1)![0].oldEnd).equals(1);
    expect(fileHunks.get(fileName1)![0].newStart).equals(1);
    expect(fileHunks.get(fileName1)![0].newEnd).equals(1);
    expect(fileHunks.get(fileName2)!.length).equals(2);
    expect(fileHunks.get(fileName2)![0].oldStart).equals(1);
    // FIXME(chingor): only additions and only removals are broken
    expect(fileHunks.get(fileName2)![0].oldEnd).equals(0);
    expect(fileHunks.get(fileName2)![0].newStart).equals(1);
    expect(fileHunks.get(fileName2)![0].newEnd).equals(1);
    expect(fileHunks.get(fileName2)![1].oldStart).equals(16);
    expect(fileHunks.get(fileName2)![1].oldEnd).equals(16);
    expect(fileHunks.get(fileName2)![1].newStart).equals(16);
    expect(fileHunks.get(fileName2)![1].newEnd).equals(17);
  });

  it('Does not generate hunks for changes that contain no updates', () => {
    const samediffContents = new Map();
    samediffContents.set('unchanged-1.txt', {oldContent: '', newContent: ''});
    samediffContents.set('unchanged-2.txt', {
      oldContent: 'same',
      newContent: 'same',
    });
    const fileHunks = getRawSuggestionHunks(samediffContents);
    expect(fileHunks.size).equals(0);
  });
});
