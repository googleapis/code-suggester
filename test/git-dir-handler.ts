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

import {describe, it, afterEach} from 'mocha';
import {assert, expect} from 'chai';
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

before(() => {
  setup();
});

// tslint:disable:no-unused-expression
// .null triggers ts-lint failure, but is valid chai
describe('git directory diff output to git file data + content', () => {
  const relativeGitDir = '/fixtures/some/git/dir';
  const absoluteGitDir = process.cwd() + relativeGitDir;
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    // undo all changes
    sandbox.restore();
  });
  it('the git diff parser does not read from file if the file status is deleted and uses the old mode', async () => {
    // setup
    const stubReadFile = sandbox.stub(fs, 'readFile').resolves('Text');
    const gitDiffTxt = ':100644 000000 8e6c063 0000000 D\tReadme.md';
    const gitFileData = await getGitFileData(absoluteGitDir, gitDiffTxt);
    expect(gitFileData.path).equals('Readme.md');
    expect(gitFileData.fileData.mode).equals('100644');
    expect(gitFileData.fileData.content).is.null;
    sinon.assert.notCalled(stubReadFile);
  });
  it('the git diff parser gets the new file mode, content and path for created files', async () => {
    // setup
    const stubReadFile = sandbox.stub(fs, 'readFile').yields(null, 'Text');
    const gitDiffTxtAdd = ':000000 100644 0000000 8e6c063 A\tReadme.md';
    const gitFileDataAdd = await getGitFileData(absoluteGitDir, gitDiffTxtAdd);
    expect(gitFileDataAdd.fileData.content).equals('Text');
    expect(gitFileDataAdd.fileData.mode).equals('100644');
    expect(gitFileDataAdd.path).equals('Readme.md');
    sinon.assert.calledOnce(stubReadFile);
  });
  it('the git diff parser gets the new file mode, content and path for content modified files', async () => {
    // setup
    const stubReadFile = sandbox.stub(fs, 'readFile').yields(null, 'new text');
    const gitDiffTxtModified =
      ':100644 100644 0000000 8e6c063 M\tmodified/test.txt';
    const gitFileDataModified = await getGitFileData(
      absoluteGitDir,
      gitDiffTxtModified
    );
    expect(gitFileDataModified.fileData.content).equals('new text');
    expect(gitFileDataModified.fileData.mode).equals('100644');
    expect(gitFileDataModified.path).equals('modified/test.txt');
    sinon.assert.calledOnce(stubReadFile);
  });

  it('the git diff parser gets the new file mode, content and path for mode modified files', async () => {
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
    expect(gitFileDataTxtToExecutable.fileData.content).equals('#!/bin/bash');
    expect(gitFileDataTxtToExecutable.fileData.mode).equals('100755');
    expect(gitFileDataTxtToExecutable.path).equals('bin/main/test.exe');
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
  const absoluteGitDir = process.cwd() + '/test/fixtures';

  it("Resolves to absolute path when '..' is a prefix", () => {
    const relativeGitDir = '../code-suggester/test/fixtures';
    expect(resolvePath(relativeGitDir)).equals(absoluteGitDir);
  });

  it("Resolves to absolute path when './' is a prefix", () => {
    const relativeGitDir = './test/fixtures';
    expect(resolvePath(relativeGitDir)).equals(absoluteGitDir);
  });

  it('Resolves to absolute path when the leading chars are letters', () => {
    const relativeGitDir = 'test/fixtures';
    expect(resolvePath(relativeGitDir)).equals(absoluteGitDir);
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
    expect(findRepoRoot('home/user/work/subdir')).equals('/home/user/work');
  });

  it('Rethrows execsync error', () => {
    sandbox.stub(child_process, 'execSync').throws(Error('Execsync error'));
    try {
      findRepoRoot('home/user/work/subdir');
      assert.fail();
    } catch (err) {
      assert.isOk(true);
      expect(err.message).equals('Execsync error');
    }
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
    expect(diffs[0]).equals(':000000 100644 0000000 8e6c063 A\tadded.txt');
    expect(diffs[1]).equals(':100644 000000 8e6c063 0000000 D\tdeleted.txt');
    expect(diffs.length).equals(2);
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
    expect(changes.get('added.txt')?.mode).equals('100644');
    expect(changes.get('added.txt')?.content).equals('new text');
    expect(changes.get('deleted.txt')?.mode).equals('100644');
    expect(changes.get('deleted.txt')?.content).is.null;
  });
  it('Passes up the error message with a throw when it is ', async () => {
    // setup
    sandbox.stub(fs, 'readFile').throws(Error());
    try {
      await parseChanges(diffs, '');
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
  });
  it('Passes up the error message with a throw when reading the file fails', async () => {
    // setup
    sandbox.stub(fs, 'readFile').yields(Error(), '');
    try {
      await parseChanges(diffs, '');
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
  });
  it('Passes up the error message with a throw when parsing the diff fails', async () => {
    // setup
    try {
      const badDiff = [':000000 100644 0000000 8e6c063 Aadded.txt'];
      await parseChanges(badDiff, '');
      assert.fail();
    } catch (err) {
      assert.isOk(true);
    }
  });
});
