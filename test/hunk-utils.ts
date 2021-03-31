// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it, before} from 'mocha';
import {setup} from './util';
import * as assert from 'assert';
import {adjustHunkUp, adjustHunkDown} from '../src/github-handler/hunk-utils';

before(() => {
  setup();
});

describe('adjustHunkUp', () => {
  it('returns a new hunk if there is a previous line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
      nextLine: "- name: 'ubuntu'",
      previousLine: "- name: 'ubuntu'",
    };
    const adjustedHunk = adjustHunkUp(hunk);
    assert.deepStrictEqual(adjustedHunk, {
      oldStart: 4,
      oldEnd: 5,
      newStart: 4,
      newEnd: 5,
      newContent: ["- name: 'ubuntu'", "  args: ['sleep', '301']"],
    });
  });
  it('returns null if there is no previous line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
    };
    const adjustedHunk = adjustHunkUp(hunk);
    assert.strictEqual(adjustedHunk, null);
  });
});

describe('adjustHunkDown', () => {
  it('returns a new hunk if there is a next line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
      nextLine: "- name: 'ubuntu'",
      previousLine: "- name: 'ubuntu'",
    };
    const adjustedHunk = adjustHunkDown(hunk);
    assert.deepStrictEqual(adjustedHunk, {
      oldStart: 5,
      oldEnd: 6,
      newStart: 5,
      newEnd: 6,
      newContent: ["  args: ['sleep', '301']", "- name: 'ubuntu'"],
    });
  });
  it('returns null if there is no previous line', () => {
    const hunk = {
      oldStart: 5,
      oldEnd: 5,
      newStart: 5,
      newEnd: 5,
      newContent: ["  args: ['sleep', '301']"],
    };
    const adjustedHunk = adjustHunkDown(hunk);
    assert.deepStrictEqual(adjustedHunk, null);
  });
});
