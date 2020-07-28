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
import {parseTextFiles} from '../src/';
import {FileData} from '../src/types';

before(() => {
  setup();
});

// tslint:disable:no-unused-expression
// .true triggers ts-lint failure, but is valid chai

describe('Parse text files function', () => {
  it('Parses map objects into Change object', () => {
    const userFilesMap = new Map<string, string | null>();
    userFilesMap.set('src/index.js', "console.log('hello index!'");
    userFilesMap.set('src/foo.js', "console.log('hello foo!'");
    userFilesMap.set('src/deleted.js', null);

    const parsedMap = new Map<string, FileData>();
    parsedMap.set('src/index.js', {
      content: "console.log('hello index!'",
      mode: '100644',
    });
    parsedMap.set('src/foo.js', {
      content: "console.log('hello foo!'",
      mode: '100644',
    });
    parsedMap.set('src/deleted.js', {
      content: null,
      mode: '100644',
    });
    // tests
    const changes = parseTextFiles(userFilesMap);
    expect(changes).to.deep.equal(parsedMap);
  });
  it('Parses objects of string property value into Change object', () => {
    const userFilesObject = {
      'src/index.js': "console.log('hello index!'",
      'src/foo.js': "console.log('hello foo!'",
      'src/deleted.js': null,
    };

    const parsedMap = new Map<string, FileData>();
    parsedMap.set('src/index.js', {
      content: "console.log('hello index!'",
      mode: '100644',
    });
    parsedMap.set('src/foo.js', {
      content: "console.log('hello foo!'",
      mode: '100644',
    });
    parsedMap.set('src/deleted.js', {
      content: null,
      mode: '100644',
    });
    // tests
    const changes = parseTextFiles(userFilesObject);
    expect(changes).to.deep.equal(parsedMap);
  });
  it('Rejects invalid file data for objects', () => {
    // tests
    try {
      const userFilesObject = {
        'src/index.js': [],
      };
      parseTextFiles((userFilesObject as unknown) as {[index: string]: string});
      expect.fail(
        'Text files parsing should not accept non-null/non-string content'
      );
    } catch (err) {
      expect(err instanceof TypeError).true;
    }
    try {
      const userFilesObject = {
        'src/foo.js': 1234,
      };
      parseTextFiles((userFilesObject as unknown) as {[index: string]: string});
      expect.fail(
        'Text files parsing should not accept non-null/non-string content'
      );
    } catch (err) {
      expect(err instanceof TypeError).true;
    }
    try {
      const userFilesObject = {
        'src/deleted.js': undefined,
      };
      parseTextFiles((userFilesObject as unknown) as {[index: string]: string});
      expect.fail(
        'Text files parsing should not accept non-null/non-string content'
      );
    } catch (err) {
      expect(err instanceof TypeError).true;
    }
  });
  it('Rejects invalid file data for map', () => {
    // tests
    try {
      const userFilesMap = new Map();
      userFilesMap.set('asfd', 1);
      parseTextFiles(userFilesMap);
      expect.fail(
        'Text files parsing should not accept non-null/non-string content'
      );
    } catch (err) {
      expect(err instanceof TypeError).true;
    }
    try {
      const userFilesMap = new Map();
      userFilesMap.set('asfd', undefined);
      parseTextFiles(userFilesMap);
      parseTextFiles(userFilesMap);
      expect.fail(
        'Text files parsing should not accept non-null/non-string content'
      );
    } catch (err) {
      expect(err instanceof TypeError).true;
    }
    try {
      const userFilesMap = new Map();
      userFilesMap.set('asfd', []);
      parseTextFiles(userFilesMap);
      parseTextFiles(userFilesMap);
      expect.fail(
        'Text files parsing should not accept non-null/non-string content'
      );
    } catch (err) {
      expect(err instanceof TypeError).true;
    }
  });
});
