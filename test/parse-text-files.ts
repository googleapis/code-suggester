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
import {parseTextFiles} from '../src/';
import {FileData} from '../src/types';

before(() => {
  setup();
});

describe('Parse text files function', () => {
  it('should parse map objects into Change object', () => {
    const userFilesMap = new Map<string, string | null>();
    userFilesMap.set('src/index.js', "console.log('hello index!'");
    userFilesMap.set('src/foo.js', "console.log('hello foo!'");
    userFilesMap.set('src/deleted.js', null);

    const parsedMap = new Map<string, FileData>();
    parsedMap.set(
      'src/index.js',
      new FileData("console.log('hello index!'", '100644')
    );
    parsedMap.set(
      'src/foo.js',
      new FileData("console.log('hello foo!'", '100644')
    );
    parsedMap.set('src/deleted.js', new FileData(null, '100644'));
    // tests
    const changes = parseTextFiles(userFilesMap);
    console.log(changes);
    assert.deepStrictEqual(changes, parsedMap);
  });
  it('Parses objects of string property value into Change object', () => {
    const userFilesObject = {
      'src/index.js': "console.log('hello index!'",
      'src/foo.js': "console.log('hello foo!'",
      'src/deleted.js': null,
    };
    const parsedMap = new Map<string, FileData>();
    parsedMap.set(
      'src/index.js',
      new FileData("console.log('hello index!'", '100644')
    );
    parsedMap.set(
      'src/foo.js',
      new FileData("console.log('hello foo!'", '100644')
    );
    parsedMap.set('src/deleted.js', new FileData(null, '100644'));
    // tests
    const changes = parseTextFiles(userFilesObject);
    assert.deepStrictEqual(changes, parsedMap);
  });
  it('Rejects invalid file data for objects', () => {
    // tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userFilesObject: any = {
      'src/index.js': [],
    };
    assert.throws(
      () => parseTextFiles(userFilesObject),
      err => {
        assert.ok(err instanceof TypeError);
        return true;
      }
    );
    userFilesObject = {
      'src/foo.js': 1234,
    };
    assert.throws(
      () => parseTextFiles(userFilesObject),
      err => {
        assert.ok(err instanceof TypeError);
        return true;
      }
    );
    userFilesObject = {
      'src/deleted.js': undefined,
    };
    assert.throws(
      () => parseTextFiles(userFilesObject),
      err => {
        assert.ok(err instanceof TypeError);
        return true;
      }
    );
  });
  it('Rejects invalid file data for map', () => {
    const userFilesMap = new Map();
    userFilesMap.set('asfd', 1);
    assert.throws(
      () => parseTextFiles(userFilesMap),
      err => {
        assert.ok(err instanceof TypeError);
        return true;
      }
    );

    userFilesMap.set('asfd', undefined);
    assert.throws(
      () => parseTextFiles(userFilesMap),
      err => {
        assert.ok(err instanceof TypeError);
        return true;
      }
    );

    userFilesMap.set('asfd', []);
    assert.throws(
      () => parseTextFiles(userFilesMap),
      err => {
        assert.ok(err instanceof TypeError);
        return true;
      }
    );
  });
});
