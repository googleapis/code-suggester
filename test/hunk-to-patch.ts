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
import {generatePatches} from '../src/github-handler/comment-handler/raw-patch-handler/hunk-to-patch-handler';
import {Hunk, FileDiffContent} from '../src/types';

before(() => {
  setup();
});

describe('generatePatches', () => {
  const diffContents: Map<string, FileDiffContent> = new Map();
  const filesHunks: Map<string, Hunk[]> = new Map();

  const fileName1Addition = 'file-1.txt';
  const fileName2Addition = 'file-2.txt';
  const fileNameDelete = 'file-3.txt';
  const fileNameSpecialChar1 = 'file-4.txt';
  const fileNameEmtpy = 'file-5.txt';
  const fileNameNonEmtpy = 'file-6.txt';

  beforeEach(() => {
    diffContents.clear();
    filesHunks.clear();
  });

  it('Gets the correct substrings when there is 1 addition', () => {
    diffContents.set(fileName1Addition, {
      oldContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
      newContent:
        'addition+line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });
    filesHunks.set(fileName1Addition, [
      {oldStart: 1, oldEnd: 6, newStart: 1, newEnd: 7},
    ]);
    const filePatches = generatePatches(filesHunks, diffContents);
    expect(filePatches.get(fileName1Addition)!).deep.equals([
      {
        start: 1,
        end: 6,
        newContent: 'addition+line1\nline2\nline3\nline4\nline5\nline6\nline7',
      },
    ]);
  });

  it('Gets the correct substrings when there is 2 additions', () => {
    diffContents.set(fileName2Addition, {
      oldContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
      newContent:
        'line0\nline1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10+another addition\n',
    });
    filesHunks.set(fileName2Addition, [
      {oldStart: 1, oldEnd: 6, newStart: 1, newEnd: 7},
      {oldStart: 9, oldEnd: 12, newStart: 10, newEnd: 13},
    ]);
    const filePatches = generatePatches(filesHunks, diffContents);
    expect(filePatches.get(fileName2Addition)!).deep.equals([
      {
        start: 1,
        end: 6,
        newContent: 'line0\nline1\nline2\nline3\nline4\nline5\nline6',
      },
      {
        start: 9,
        end: 12,
        newContent: 'line9\nline10+another addition\n',
      },
    ]);
  });

  it('Gets the correct substrings when there is 1 deletion', () => {
    diffContents.set(fileNameDelete, {
      oldContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
      newContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\n',
    });
    filesHunks.set(fileNameDelete, [
      {oldStart: 9, oldEnd: 12, newStart: 9, newEnd: 11},
    ]);
    const filePatches = generatePatches(filesHunks, diffContents);
    expect(filePatches.get(fileNameDelete)!).deep.equals([
      {
        start: 9,
        end: 12,
        newContent: 'line9\n',
      },
    ]);
  });

  it('Gets the correct substrings when there is a special patch char prepending the text', () => {
    diffContents.set(fileNameSpecialChar1, {
      oldContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
      newContent:
        '+line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });

    filesHunks.set(fileNameSpecialChar1, [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
    const filePatches = generatePatches(filesHunks, diffContents);
    expect(filePatches.get(fileNameSpecialChar1)!).deep.equals([
      {
        start: 1,
        end: 2,
        newContent: '+line1\nline2',
      },
    ]);
  });

  it('Gets the correct substrings when the file is now an empty string', () => {
    diffContents.set(fileNameEmtpy, {
      oldContent: 'line1',
      newContent: '',
    });

    filesHunks.set(fileNameEmtpy, [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 1},
    ]);
    const filePatches = generatePatches(filesHunks, diffContents);
    expect(filePatches.get(fileNameEmtpy)!).deep.equals([
      {
        start: 1,
        end: 2,
        newContent: '',
      },
    ]);
  });

  it('Gets the correct substrings when the empty string file is now has text', () => {
    diffContents.set(fileNameNonEmtpy, {
      oldContent: '',
      newContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });

    filesHunks.set(fileNameNonEmtpy, [
      {oldStart: 1, oldEnd: 1, newStart: 1, newEnd: 12},
    ]);
    const filePatches = generatePatches(filesHunks, diffContents);
    expect(filePatches.get(fileNameNonEmtpy)!).deep.equals([
      {
        start: 1,
        end: 1,
        newContent:
          'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
      },
    ]);
  });

  it('Throws an error when the new start hunk line is 0', () => {
    diffContents.set(fileNameNonEmtpy, {
      oldContent: '',
      newContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });
    filesHunks.set(fileNameNonEmtpy, [
      {oldStart: 1, oldEnd: 1, newStart: 0, newEnd: 12},
    ]);
    try {
      generatePatches(filesHunks, diffContents);
      expect.fail(
        'Should have errored because the new start line is < 1. Value should be >= 1'
      );
    } catch (err) {
      expect(err instanceof RangeError).equals(true);
    }
  });
  it('Throws an error when the new end hunk line is 0', () => {
    diffContents.set(fileNameNonEmtpy, {
      oldContent: '',
      newContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });
    filesHunks.set(fileNameNonEmtpy, [
      {oldStart: 2, oldEnd: 1, newStart: 1, newEnd: 0},
    ]);
    try {
      generatePatches(filesHunks, diffContents);
      expect.fail(
        'Should have errored because the new end line is < 1. Value should be >= 1'
      );
    } catch (err) {
      expect(err instanceof RangeError).equals(true);
    }
  });
  it('Throws an error when the old start hunk line is 0', () => {
    diffContents.set(fileNameNonEmtpy, {
      oldContent: '',
      newContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });
    filesHunks.set(fileNameNonEmtpy, [
      {oldStart: 0, oldEnd: 1, newStart: 1, newEnd: 12},
    ]);
    try {
      generatePatches(filesHunks, diffContents);
      expect.fail(
        'Should have errored because the old start line is < 1. Value should be >= 1'
      );
    } catch (err) {
      expect(err instanceof RangeError).equals(true);
    }
  });
  it('Throws an error when theold end hunk line is 0', () => {
    diffContents.set(fileNameNonEmtpy, {
      oldContent: '',
      newContent:
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n',
    });
    filesHunks.set(fileNameNonEmtpy, [
      {oldStart: 2, oldEnd: 0, newStart: 1, newEnd: 2},
    ]);
    try {
      generatePatches(filesHunks, diffContents);
      expect.fail(
        'Should have errored because the old end line is < 1. Value should be >= 1'
      );
    } catch (err) {
      expect(err instanceof RangeError).equals(true);
    }
  });
});
