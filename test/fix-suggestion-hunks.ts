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
import {
  findRange,
  filterOutOfScopeHunks,
  filterOutOfScopeFiles,
} from '../src/github-handler/comment-handler/suggestion-patch-handler/fix-suggestion-hunks-handler';
import {Range, FileRanges, FileHunks} from '../src/types';

before(() => {
  setup();
});

describe('findRange', () => {
  const ranges: Range[] = [
    {start: 1, end: 2},
    {start: 5, end: 8},
    {start: 10, end: 12},
    {start: 14, end: 15},
    {start: 20, end: 25},
    {start: 100, end: 125},
  ];
  it('Returns the index of the interval that contains the numeric input', () => {
    expect(findRange(ranges, 1)).equals(0);
    expect(findRange(ranges, 2)).equals(0);
    expect(findRange(ranges, 100)).equals(5);
    expect(findRange(ranges, 125)).equals(5);
    expect(findRange(ranges, 126)).equals(-1);
    expect(findRange(ranges, 0)).equals(-1);
    expect(findRange(ranges, 3)).equals(-1);
  });
  it('Returns -1 if there is no interval domain in which the numeric input satisfies', () => {
    expect(findRange(ranges, 126)).equals(-1);
    expect(findRange(ranges, 0)).equals(-1);
    expect(findRange(ranges, 3)).equals(-1);
  });
});

describe('filterOutOfScopeHunks', () => {
  const scope: FileRanges = new Map();
  const suggestions: FileHunks = new Map();
  const fileName1 = 'foo.txt';
  const fileName2 = 'bar.txt';
  const fileName3 = 'baz.txt';
  scope.set(fileName1, [
    {start: 1, end: 20},
    {start: 50, end: 79},
  ]);
  scope.set(fileName2, [{start: 15, end: 54}]);
  scope.set(fileName3, [{start: 1, end: 2}]);

  beforeEach(() => {
    suggestions.clear();
  });

  it('Keeps file hunks that are in scope for the pull request', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    suggestions.set(fileName3, [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
    filterOutOfScopeHunks(scope, suggestions);
    expect(suggestions.size).equals(3);
    expect(suggestions.get(fileName1)!).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    expect(suggestions.get(fileName2)!).deep.equals([
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    expect(suggestions.get(fileName3)!).deep.equals([
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
  });

  it('Keeps file hunks that are in scope for the pull request even if there are files without a hunk', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    filterOutOfScopeHunks(scope, suggestions);
    expect(suggestions.size).equals(1);
    expect(suggestions.get(fileName1)!).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
  });

  it('Removes files hunks that are out of scope for the pull request because the lines are out of scope', () => {
    suggestions.set(fileName1, [
      {oldStart: 20, oldEnd: 49, newStart: 20, newEnd: 49},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 14, oldEnd: 55, newStart: 15, newEnd: 54},
    ]);
    filterOutOfScopeHunks(scope, suggestions);
    expect(suggestions.size).equals(0);
  });

  it('Removes files hunks that are out of scope for the pull request because the file is not in scope', () => {
    suggestions.set('non-existant-file.txt', [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
    filterOutOfScopeHunks(scope, suggestions);
    expect(suggestions.size).equals(0);
  });
});

describe('filterOutOfScopeFiles', () => {
  const fileName1 = 'foo.txt';
  const fileName2 = 'bar.txt';
  const fileName3 = 'baz.txt';
  const invalidFiles = [
    fileName3,
    'BAZ.txt',
    'baz-1.txt',
    'bbaz.txt',
    'foo/bar/baz.txt',
  ];
  const suggestions: FileHunks = new Map();

  beforeEach(() => {
    suggestions.clear();
  });

  it('Keeps files that are valid', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    filterOutOfScopeFiles(invalidFiles, suggestions);
    expect(suggestions.size).equals(2);
    expect(suggestions.get(fileName1)!).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    expect(suggestions.get(fileName2)!).deep.equals([
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
  });

  it('Removes files that do not appear in the invalid list', () => {
    suggestions.set(fileName3, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    filterOutOfScopeFiles(invalidFiles, suggestions);
    expect(suggestions.size).equals(0);
  });
});
