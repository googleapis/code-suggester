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
  getInScopeHunks,
  getInScopeByFileName,
  getOutOfScopeByFileName,
  mergeOutOfScopeSuggestions,
} from '../src/github-handler/comment-handler/suggestion-patch-handler/scope-suggestion-hunks-handler';
import {Range, Hunk} from '../src/types';

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

describe('getInScopeHunks', () => {
  const scope: Map<string, Range[]> = new Map();
  const suggestions: Map<string, Hunk[]> = new Map();
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

  it('Calculates file hunks that are in scope for the pull request', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    suggestions.set(fileName3, [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
    const {inScopeFilesHunks} = getInScopeHunks(scope, suggestions);
    expect(inScopeFilesHunks.size).equals(3);
    expect(inScopeFilesHunks.get(fileName1)!).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    expect(inScopeFilesHunks.get(fileName2)!).deep.equals([
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    expect(inScopeFilesHunks.get(fileName3)!).deep.equals([
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
  });

  it('Calculates file hunks that are in scope for the pull request even if the suggestions are a subset of the total PR scope', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    const {inScopeFilesHunks} = getInScopeHunks(scope, suggestions);
    expect(inScopeFilesHunks.size).equals(1);
    expect(inScopeFilesHunks.get(fileName1)!).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
  });

  it('Calculates file hunks that are out of scope for the pull request even if the suggestions are a subset of the total PR scope', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    const {outOfScopeFilesHunks} = getInScopeHunks(scope, suggestions);
    expect(outOfScopeFilesHunks.size).equals(0);
  });

  it('Calculates files hunks that are out of scope for the pull request because the lines are out of scope', () => {
    suggestions.set(fileName1, [
      {oldStart: 20, oldEnd: 49, newStart: 20, newEnd: 49},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 14, oldEnd: 55, newStart: 15, newEnd: 54},
    ]);
    const {inScopeFilesHunks, outOfScopeFilesHunks} = getInScopeHunks(
      scope,
      suggestions
    );
    expect(inScopeFilesHunks.size).equals(0);
    expect(outOfScopeFilesHunks.size).equals(2);
    expect(outOfScopeFilesHunks.get(fileName1)).deep.equals([
      {oldStart: 20, oldEnd: 49, newStart: 20, newEnd: 49},
    ]);
  });

  it('Calculates files hunks that are out of scope for the pull request because the file is not in scope', () => {
    suggestions.set('non-existant-file.txt', [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
    const {inScopeFilesHunks, outOfScopeFilesHunks} = getInScopeHunks(
      scope,
      suggestions
    );
    expect(inScopeFilesHunks.size).equals(0);
    expect(outOfScopeFilesHunks.size).equals(1);
    expect(outOfScopeFilesHunks.get('non-existant-file.txt')).deep.equals([
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
  });
});

describe('getInScopeByFileName', () => {
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
  const suggestions: Map<string, Hunk[]> = new Map();

  beforeEach(() => {
    suggestions.clear();
  });

  it('Calculates files that are valid', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    const inScopeFiles = getInScopeByFileName(invalidFiles, suggestions);
    expect(inScopeFiles.size).equals(2);
    expect(inScopeFiles.get(fileName1)).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    expect(inScopeFiles.get(fileName2)).deep.equals([
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
  });

  it('Does not include files that do not appear in the invalid list', () => {
    suggestions.set(fileName3, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    const inScopeFiles = getInScopeByFileName(invalidFiles, suggestions);
    expect(inScopeFiles.size).equals(0);
  });
});

describe('getOutOfScopeByFileName', () => {
  const fileName1 = 'foo.txt';
  const fileName2 = 'bar.txt';
  const fileName3 = 'baz.txt';
  const invalidFiles = [fileName1, fileName2, fileName3];
  const suggestions: Map<string, Hunk[]> = new Map();

  beforeEach(() => {
    suggestions.clear();
  });

  it('Calculates files that are invalid and gets their hunks', () => {
    suggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    suggestions.set(fileName2, [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    suggestions.set('valid-file.txt', [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    const outOfScopeFiles = getOutOfScopeByFileName(invalidFiles, suggestions);
    expect(outOfScopeFiles.size).equals(2);
    expect(outOfScopeFiles.get(fileName1)).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    expect(outOfScopeFiles.get(fileName2)).deep.equals([
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    expect(outOfScopeFiles.has('valid-file.txt')).equals(false);
  });

  it('Does not include files if they are all valid', () => {
    suggestions.set('valid-file-1.txt', [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    suggestions.set('valid-file-2.txt', [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    const outofScopeFiles = getOutOfScopeByFileName(invalidFiles, suggestions);
    expect(outofScopeFiles.size).equals(0);
  });
});

describe('mergeOutOfScopeSuggestions', () => {
  const fileName1 = 'foo.txt';
  const fileName2 = 'bar.txt';
  const fileName3 = 'baz.txt';
  const invalidFileNameSuggestions: Map<string, Hunk[]> = new Map();
  const invalidHunkSuggestions: Map<string, Hunk[]> = new Map();

  beforeEach(() => {
    invalidFileNameSuggestions.clear();
    invalidHunkSuggestions.clear();
  });

  it('Gets all the files whose file name is out of scope and/or has out of scope hunks', () => {
    invalidFileNameSuggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    invalidFileNameSuggestions.set(fileName2, [
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    invalidHunkSuggestions.set(fileName3, [
      {oldStart: 2, oldEnd: 54, newStart: 2, newEnd: 10},
    ]);
    const outOfScope = mergeOutOfScopeSuggestions(
      invalidFileNameSuggestions,
      invalidHunkSuggestions
    );
    expect(outOfScope.size).equals(3);
    expect(outOfScope.get(fileName1)).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    expect(outOfScope.get(fileName2)).deep.equals([
      {oldStart: 50, oldEnd: 54, newStart: 50, newEnd: 53},
    ]);
    expect(outOfScope.get(fileName3)).deep.equals([
      {oldStart: 2, oldEnd: 54, newStart: 2, newEnd: 10},
    ]);
  });

  it('Takes the invalid files hunk data over the invalid hunk data because invalid file hunks are a superset', () => {
    invalidFileNameSuggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
      {oldStart: 100, oldEnd: 120, newStart: 100, newEnd: 130},
      {oldStart: 1000, oldEnd: 1200, newStart: 1000, newEnd: 1300},
    ]);
    invalidHunkSuggestions.set(fileName1, [
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
    ]);
    const outOfScope = mergeOutOfScopeSuggestions(
      invalidFileNameSuggestions,
      invalidHunkSuggestions
    );
    expect(outOfScope.size).equals(1);
    expect(outOfScope.get(fileName1)).deep.equals([
      {oldStart: 1, oldEnd: 20, newStart: 1, newEnd: 30},
      {oldStart: 100, oldEnd: 120, newStart: 100, newEnd: 130},
      {oldStart: 1000, oldEnd: 1200, newStart: 1000, newEnd: 1300},
    ]);
  });
});
