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

/* eslint-disable node/no-unsupported-features/node-builtins */

import {describe, it, before, afterEach} from 'mocha';
import * as assert from 'assert';
import {setup} from './util';
import {
  getGitFileData,
  getAllDiffs,
  parseChanges,
  findRepoRoot,
  resolvePath,
} from '../src/bin/handle-git-dir-change';
import * as fs from 'fs';
import * as sinon from 'sinon';
import * as child_process from 'child_process';
import * as path from 'path';

before(() => {
  setup();
});

describe('git directory diff output to git file data + content', () => {
  const relativeGitDir = '/fixtures/some/git/dir';
  const absoluteGitDir = process.cwd() + relativeGitDir;
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    // undo all changes
    sandbox.restore();
  });
  it('does not read from a file if the file status is deleted and uses the old mode', async () => {
    // setup
    const stubReadFile = sandbox.stub(fs, 'readFile').resolves('Text');
    const gitDiffTxt = ':100644 000000 8e6c063 0000000 D\tReadme.md';
    const gitFileData = await getGitFileData(absoluteGitDir, gitDiffTxt);
    assert.strictEqual(gitFileData.path, 'Readme.md');
    assert.strictEqual(gitFileData.fileData.mode, '100644');
    assert.strictEqual(gitFileData.fileData.content, null);
    sinon.assert.notCalled(stubReadFile);
  });
  it('gets the new file mode, content and path for created files', async () => {
    // setup
    const stubReadFile = sandbox.stub(fs, 'readFile').yields(null, 'Text');
    const gitDiffTxtAdd = ':000000 100644 0000000 8e6c063 A\tReadme.md';
    const gitFileDataAdd = await getGitFileData(absoluteGitDir, gitDiffTxtAdd);
    assert.strictEqual(gitFileDataAdd.fileData.content, 'Text');
    assert.strictEqual(gitFileDataAdd.fileData.mode, '100644');
    assert.strictEqual(gitFileDataAdd.path, 'Readme.md');
    sinon.assert.calledOnce(stubReadFile);
  });
  it('gets the new file mode, content and path for content modified files', async () => {
    // setup
    const stubReadFile = sandbox.stub(fs, 'readFile').yields(null, 'new text');
    const gitDiffTxtModified =
      ':100644 100644 0000000 8e6c063 M\tmodified/test.txt';
    const gitFileDataModified = await getGitFileData(
      absoluteGitDir,
      gitDiffTxtModified
    );
    assert.strictEqual(gitFileDataModified.fileData.content, 'new text');
    assert.strictEqual(gitFileDataModified.fileData.mode, '100644');
    assert.strictEqual(gitFileDataModified.path, 'modified/test.txt');
    sinon.assert.calledOnce(stubReadFile);
  });

  it('gets the new file mode, content and path for mode modified files', async () => {
    // setup
    const stubReadFile = sandbox
      .stub(fs, 'readFile')
      .yields(null, '#!/bin/bash');
    const gitDiffTxtToExecutable =
      ':100644 100755 3b18e51 3b18e51 M\tbin/main/test.exe';
    const gitFileDataTxtToExecutable = await getGitFileData(
      absoluteGitDir,
      gitDiffTxtToExecutable
    );
    assert.strictEqual(
      gitFileDataTxtToExecutable.fileData.content,
      '#!/bin/bash'
    );
    assert.strictEqual(gitFileDataTxtToExecutable.fileData.mode, '100755');
    assert.strictEqual(gitFileDataTxtToExecutable.path, 'bin/main/test.exe');
    sinon.assert.calledOnce(stubReadFile);
  });
});

describe('Repository root', () => {
  const dir = '/some/dir';
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    // undo all changes
    sandbox.restore();
  });
  it('Executes the git find root bash command', () => {
    const stubGitDiff = sandbox
      .stub(child_process, 'execSync')
      .returns(Buffer.from(dir));
    findRepoRoot(dir);
    sinon.assert.calledOnceWithExactly(
      stubGitDiff,
      'git rev-parse --show-toplevel',
      {cwd: dir}
    );
  });
});

describe('Path resolving', () => {
  it("Resolves to absolute path when './' is a prefix", () => {
    const relativeGitDir = './test/fixtures';
    const testingPath = resolvePath(relativeGitDir);
    assert.strictEqual(path.isAbsolute(testingPath), true);
  });

  it('Resolves to absolute path when the leading chars are letters', () => {
    const relativeGitDir = 'test/fixtures';
    const testingPath = resolvePath(relativeGitDir);
    assert.strictEqual(path.isAbsolute(testingPath), true);
  });
});

describe('Finding repository root', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('Removes the \\n character', () => {
    sandbox
      .stub(child_process, 'execSync')
      .returns(Buffer.from('/home/user/work\n'));
    assert.strictEqual(
      findRepoRoot('home/user/work/subdir'),
      '/home/user/work'
    );
  });

  it('Rethrows execsync error', () => {
    const error = new Error('Execsync error');
    sandbox.stub(child_process, 'execSync').throws(error);
    assert.throws(() => findRepoRoot('home/user/work/subdir'), error);
  });
});

describe('parse all git diff output', () => {
  const testDir = process.cwd() + '/fixtures';
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    // undo all changes
    sandbox.restore();
  });
  it('splits file diff into a list and removed \\n', async () => {
    sandbox
      .stub(child_process, 'execSync')
      .returns(
        Buffer.from(
          ':000000 100644 0000000 8e6c063 A\tadded.txt\n:100644 000000 8e6c063 0000000 D\tdeleted.txt\n'
        )
      );
    const diffs = getAllDiffs(testDir);
    assert.strictEqual(diffs[0], ':000000 100644 0000000 8e6c063 A\tadded.txt');
    assert.strictEqual(
      diffs[1],
      ':100644 000000 8e6c063 0000000 D\tdeleted.txt'
    );
    assert.strictEqual(diffs.length, 2);
  });
});

describe('parse changes', () => {
  const testDir = '/test/dir';
  const sandbox = sinon.createSandbox();
  const diffs = [
    ':000000 100644 0000000 8e6c063 A\tadded.txt',
    ':100644 000000 8e6c063 0000000 D\tdeleted.txt',
  ];
  afterEach(() => {
    // undo all changes
    sandbox.restore();
  });
  it('populates change object with everything from a diff output', async () => {
    sandbox.stub(fs, 'readFile').yields(null, 'new text');
    const changes = await parseChanges(diffs, testDir);
    assert.strictEqual(changes.get('added.txt')?.mode, '100644');
    assert.strictEqual(changes.get('added.txt')?.content, 'new text');
    assert.strictEqual(changes.get('deleted.txt')?.mode, '100644');
    assert.strictEqual(changes.get('deleted.txt')?.content, null);
  });
  it('Passes up the error message with a throw when it is ', async () => {
    // setup
    sandbox.stub(fs, 'readFile').throws(Error());
    await assert.rejects(parseChanges(diffs, ''));
  });
  it('Passes up the error message with a throw when reading the file fails', async () => {
    // setup
    sandbox.stub(fs, 'readFile').yields(Error(), '');
    await assert.rejects(parseChanges(diffs, ''));
  });
  it('Passes up the error message with a throw when parsing the diff fails', async () => {
    // setup
    const badDiff = [':000000 100644 0000000 8e6c063 Aadded.txt'];
    await assert.rejects(parseChanges(badDiff, ''));
  });
});
