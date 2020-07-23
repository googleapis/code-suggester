import {expect} from 'chai';
import {describe, it, before} from 'mocha';
import {setup} from './util';
import {
  changeSetHasCorrectTypes,
  hasEmptyStringOption,
  optionsHasCorrectTypes,
} from '../src/parameters-handler';
import {Changes, FileData} from '../src/types';

before(() => {
  setup();
});

// tslint:disable:no-unused-expression
// .true triggers ts-lint failure, but is valid chai
describe('Change set types validation during JavaScript runtime', () => {
  const changes: Changes = new Map();
  changes.set('src/index.ts', new FileData("console.log('new file')"));
  it('Returns false if there is an invalid change object', () => {
    const isValidString = changeSetHasCorrectTypes(('' as unknown) as Changes); // icky TypeScript hacks test JavaScript runtime behaviour
    expect(isValidString).false;
    const isValidMissingMode = changeSetHasCorrectTypes(({
      path: {content: ''},
    } as unknown) as Changes);
    expect(isValidMissingMode).false;
    const isValidMissingContent = changeSetHasCorrectTypes(({
      path: {mode: '100644'},
    } as unknown) as Changes);
    expect(isValidMissingContent).false;
  });
  it('Returns true if there is a valid change object', () => {
    const isValidChangeMap = changeSetHasCorrectTypes(changes); // icky TypeScript hacks test JavaScript runtime behaviour
    expect(isValidChangeMap).true;
    const isValidEmptyChangeMap = changeSetHasCorrectTypes(new Map()); // icky TypeScript hacks test JavaScript runtime behaviour
    expect(isValidEmptyChangeMap).true;
  });
});

describe('Creating new pull request string options empty string validation during JavaScript runtime', () => {
  const upstreamOwner = 'owner';
  const upstreamRepo = 'Hello-World';
  const description = 'custom pr description';
  const branch = 'custom-code-suggestion-branch';
  const title = 'chore: code suggestions custom PR title';
  const force = true;
  const maintainersCanModify = true;
  const message = 'chore: code suggestions custom commit message';
  const primary = 'custom-primary';
  it('Returns true when pull request string options are passed empty strings', () => {
    const isValidString1 = hasEmptyStringOption({
      upstreamOwner: '',
      upstreamRepo,
      branch,
      description,
      title,
      force,
      message,
      primary,
      maintainersCanModify,
    });
    expect(isValidString1).true;
    const isValidString2 = hasEmptyStringOption({
      upstreamOwner,
      upstreamRepo: '',
      branch,
      description,
      title,
      force,
      message,
      primary,
      maintainersCanModify,
    });
    expect(isValidString2).true;
    const isValidString3 = hasEmptyStringOption({
      upstreamOwner,
      upstreamRepo,
      branch: '',
      description,
      title,
      force,
      message,
      primary,
      maintainersCanModify,
    });
    expect(isValidString3).true;
    const isValidString4 = hasEmptyStringOption({
      upstreamOwner,
      upstreamRepo,
      branch,
      description: '',
      title,
      force,
      message,
      primary,
      maintainersCanModify,
    });
    expect(isValidString4).true;
    const isValidString5 = hasEmptyStringOption({
      upstreamOwner,
      upstreamRepo,
      branch,
      description,
      title: '',
      force,
      message,
      primary,
      maintainersCanModify,
    });
    expect(isValidString5).true;
    const isValidString6 = hasEmptyStringOption({
      upstreamOwner,
      upstreamRepo,
      branch,
      description,
      title,
      force,
      message: '',
      primary,
      maintainersCanModify,
    });
    expect(isValidString6).true;
    const isValidString7 = hasEmptyStringOption({
      upstreamOwner,
      upstreamRepo,
      branch,
      description,
      title,
      force,
      message,
      primary: '',
      maintainersCanModify,
    });
    expect(isValidString7).true;
  });
  it('Returns false when pull request string options do not contain empty strings', () => {
    expect(
      hasEmptyStringOption({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
  });
});

describe('Creating new pull request options types validation during JavaScript runtime', () => {
  const upstreamOwner = 'owner';
  const upstreamRepo = 'Hello-World';
  const description = 'custom pr description';
  const branch = 'custom-code-suggestion-branch';
  const title = 'chore: code suggestions custom PR title';
  const force = true;
  const maintainersCanModify = true;
  const message = 'chore: code suggestions custom commit message';
  const primary = 'custom-primary';
  it('Return false when any of the fields have an invalid type', () => {
    expect(
      optionsHasCorrectTypes({
        upstreamOwner: (false as unknown) as string,
        upstreamRepo,
        branch,
        description,
        title,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo: (false as unknown) as string,
        branch,
        description,
        title,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch: (false as unknown) as string,
        description,
        title,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description: (false as unknown) as string,
        title,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title: (false as unknown) as string,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title,
        force: ('string' as unknown) as boolean,
        message,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title,
        force,
        message: (false as unknown) as string,
        primary,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title,
        force,
        message,
        primary: (false as unknown) as string,
        maintainersCanModify,
      })
    ).false;
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title,
        force,
        message,
        primary,
        maintainersCanModify: ('string' as unknown) as boolean,
      })
    ).false;
  });
  it('Returns true when all of the fields have a valid type', () => {
    expect(
      optionsHasCorrectTypes({
        upstreamOwner,
        upstreamRepo,
        branch,
        description,
        title,
        force,
        message,
        primary,
        maintainersCanModify,
      })
    ).true;
  });
});
