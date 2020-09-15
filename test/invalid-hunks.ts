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
import {buildErrorMessage} from '../src/github-handler/comment-handler/make-review-handler/message-handler';

before(() => {
  setup();
});

describe('buildErrorMessage', () => {
  it('should handle an empty list of failures', () => {
    const invalidHunks = new Map();
    const expectedMessage = '';

    const errorMessage = buildErrorMessage(invalidHunks);
    expect(errorMessage).to.be.equal(expectedMessage);
  });

  it('should handle multiple file entries', () => {
    const invalidHunks = new Map();
    invalidHunks.set('foo.txt', [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
    ]);
    invalidHunks.set('bar.txt', [
      {oldStart: 3, oldEnd: 4, newStart: 3, newEnd: 4},
    ]);
    const expectedMessage = `Some suggestions could not be made:
* foo.txt
  * lines 1-2
* bar.txt
  * lines 3-4`;

    const errorMessage = buildErrorMessage(invalidHunks);
    expect(errorMessage).to.be.equal(expectedMessage);
  });

  it('should handle multiple entries for a file', () => {
    const invalidHunks = new Map();
    invalidHunks.set('foo.txt', [
      {oldStart: 1, oldEnd: 2, newStart: 1, newEnd: 2},
      {oldStart: 3, oldEnd: 4, newStart: 3, newEnd: 4},
    ]);
    const expectedMessage = `Some suggestions could not be made:
* foo.txt
  * lines 1-2
  * lines 3-4`;

    const errorMessage = buildErrorMessage(invalidHunks);
    expect(errorMessage).to.be.equal(expectedMessage);
  });
});
