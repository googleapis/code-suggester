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
import {
  generateHunks,
  getRawSuggestionHunks,
} from '../src/github-handler/comment-handler/suggestion-patch-handler/suggestion-hunk-handler';
import {RawChanges, RawContent} from '../src/types';

before(() => {
  setup();
});

describe('generateHunks', () => {
  const rawContent: RawContent = {oldContent: 'foo', newContent: 'FOO'};
  const fileName = 'README.md';
  it('Does not update the user raw change input', () => {
    generateHunks(rawContent, fileName);
    expect(rawContent.oldContent).equals('foo');
    expect(rawContent.newContent).equals('FOO');
  });

  it('Generates the hunks that are produced by the diff library given one file', () => {
    const hunk = generateHunks(rawContent, fileName);
    expect(hunk.length).equals(1);
    expect(hunk[0].oldStart).equals(1);
    expect(hunk[0].oldEnd).equals(2);
    expect(hunk[0].newStart).equals(1);
    expect(hunk[0].newEnd).equals(2);
  });

  it('Generates the hunks that are produced by the diff library given one file which was empty but now has content', () => {
    const addingContentToEmpty: RawContent = {
      oldContent: '',
      newContent: 'FOO',
    };
    const hunk = generateHunks(addingContentToEmpty, fileName);
    expect(hunk.length).equals(1);
    expect(hunk[0].oldStart).equals(1);
    expect(hunk[0].oldEnd).equals(1);
    expect(hunk[0].newStart).equals(1);
    expect(hunk[0].newEnd).equals(2);
  });
});

describe('getRawSuggestionHunks', () => {
  const rawChange: RawChanges = new Map();
  const rawContent1: RawContent = {oldContent: 'foo', newContent: 'FOO'};
  const rawContent2: RawContent = {
    oldContent:
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar',
    newContent:
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo',
  };
  const fileName1 = 'README.md';
  const fileName2 = 'bars.txt';
  rawChange.set(fileName1, rawContent1);
  rawChange.set(fileName2, rawContent2);

  it('Does not update the user raw change input', () => {
    getRawSuggestionHunks(rawChange);
    expect(rawContent1.oldContent).equals('foo');
    expect(rawContent1.newContent).equals('FOO');
    expect(rawChange.get(fileName1)!.oldContent).equals('foo');
    expect(rawChange.get(fileName1)!.newContent).equals('FOO');
    expect(rawContent2.oldContent).equals(
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar'
    );
    expect(rawContent2.newContent).equals(
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo'
    );
    expect(rawChange.get(fileName2)!.oldContent).equals(
      'bar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar'
    );
    expect(rawChange.get(fileName2)!.newContent).equals(
      'foo\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nbar\nfoo'
    );
  });

  it('Generates the hunks that are produced by the diff library for all files that are updated', () => {
    const fileHunks = getRawSuggestionHunks(rawChange);
    expect(fileHunks.size).equals(2);
    expect(fileHunks.get(fileName1)!.length).equals(1);
    expect(fileHunks.get(fileName1)![0].oldStart).equals(1);
    expect(fileHunks.get(fileName1)![0].oldEnd).equals(2);
    expect(fileHunks.get(fileName1)![0].newStart).equals(1);
    expect(fileHunks.get(fileName1)![0].newEnd).equals(2);
    expect(fileHunks.get(fileName2)!.length).equals(2);
    expect(fileHunks.get(fileName2)![0].oldStart).equals(1);
    expect(fileHunks.get(fileName2)![0].oldEnd).equals(5);
    expect(fileHunks.get(fileName2)![0].newStart).equals(1);
    expect(fileHunks.get(fileName2)![0].newEnd).equals(6);
    expect(fileHunks.get(fileName2)![1].oldStart).equals(12);
    expect(fileHunks.get(fileName2)![1].oldEnd).equals(17);
    expect(fileHunks.get(fileName2)![1].newStart).equals(13);
    expect(fileHunks.get(fileName2)![1].newEnd).equals(19);
  });

  it('Does not generate hunks for changes that contain no updates', () => {
    const sameRawChanges = new Map();
    sameRawChanges.set('unchanged-1.txt', {oldContent: '', newContent: ''});
    sameRawChanges.set('unchanged-2.txt', {
      oldContent: 'same',
      newContent: 'same',
    });
    const fileHunks = getRawSuggestionHunks(sameRawChanges);
    expect(fileHunks.size).equals(0);
  });
});
