import {expect} from 'chai';
import {describe, it, before} from 'mocha';
import {setup} from './util';
import {
  changeSetHasCorrectTypes,
  hasEmptyStringOption,
  optionsHasCorrectTypes,
  isNullOrUndefined,
  validMode,
} from '../src/parameters-handler';
import {Changes, FileData, FileMode} from '../src/types';

before(() => {
  setup();
});

// tslint:disable:no-unused-expression
// .true triggers ts-lint failure, but is valid chai

describe('isNullOrUndefined', () => {
  it('returns true when a value is a GitHub file mode', () => {
    expect(validMode('100644')).true;
    expect(validMode('040000')).true;
    expect(validMode('100755')).true;
    expect(validMode('120000')).true;
    expect(validMode('160000')).true;
  });
  it('returns false when a value is not null nor undefined', () => {
    expect(validMode(({} as unknown) as FileMode)).false;
    expect(validMode((new Map() as unknown) as FileMode)).false;
    expect(validMode((1 as unknown) as FileMode)).false;
    expect(validMode((0 as unknown) as FileMode)).false;
    expect(validMode(('' as unknown) as FileMode)).false;
    expect(validMode(([] as unknown) as FileMode)).false;
    expect(validMode((null as unknown) as FileMode)).false;
    expect(validMode((undefined as unknown) as FileMode)).false;
    expect(validMode((true as unknown) as FileMode)).false;
    expect(validMode((false as unknown) as FileMode)).false;
    expect(validMode(('12312312123213' as unknown) as FileMode)).false;
  });
});

describe('file mode validator', () => {
  it('returns true when a value is null', () => {
    expect(isNullOrUndefined(null)).true;
  });
  it('returns true when a value is undefined', () => {
    expect(isNullOrUndefined(null)).true;
  });
  it('returns false when a value is not null nor undefined', () => {
    expect(isNullOrUndefined({})).false;
    expect(isNullOrUndefined(new Map())).false;
    expect(isNullOrUndefined(1)).false;
    expect(isNullOrUndefined(0)).false;
    expect(isNullOrUndefined('')).false;
    expect(isNullOrUndefined([])).false;
    expect(isNullOrUndefined(false)).false;
    expect(isNullOrUndefined(true)).false;
  });
});

describe('Change set types validation during JavaScript runtime', () => {
  const changes: Changes = new Map();
  changes.set('src/index.ts', new FileData("console.log('new file')"));
  changes.set(
    'src/index.ts',
    new FileData("console.log('new file')", '100755')
  );
  changes.set(
    'src/index.ts',
    new FileData("console.log('new file')", '040000')
  );
  changes.set(
    'src/index.ts',
    new FileData("console.log('new file')", '120000')
  );
  changes.set(
    'src/index.ts',
    new FileData("console.log('new file')", '160000')
  );
  changes.set(
    'src/index.ts',
    new FileData("console.log('new file')", '100644')
  );
  it('Returns false if there is an invalid change object', () => {
    const isValidString = changeSetHasCorrectTypes(('' as unknown) as Changes);
    expect(isValidString).false;
    const badContent = new Map();
    badContent.set(
      'bad-content',
      new FileData((1 as unknown) as string, '160000')
    );
    const isValidBadContnet = changeSetHasCorrectTypes(badContent);
    expect(isValidBadContnet).false;
    const missingMode = new Map();
    missingMode.set('no-mode', new FileData('', (null as unknown) as FileMode));
    const isValidMissingMode = changeSetHasCorrectTypes(missingMode);
    expect(isValidMissingMode).false;
    const invalidMode = new Map();
    invalidMode.set('invalid-mode', new FileData('', '123' as FileMode));
    const isIncorrectMode = changeSetHasCorrectTypes(invalidMode);
    expect(isIncorrectMode).false;
    const missingContent = new Map();
    missingContent.set(
      'undefined-content',
      new FileData((undefined as unknown) as string)
    );
    const isValidMissingContent = changeSetHasCorrectTypes(missingContent);
    expect(isValidMissingContent).false;
    const isValidGeneralObject = changeSetHasCorrectTypes(
      ({} as unknown) as Changes
    );
    expect(isValidGeneralObject).false;
    const nullSizeProperty = {size: null};
    expect(changeSetHasCorrectTypes((nullSizeProperty as unknown) as Changes))
      .false;
    expect(changeSetHasCorrectTypes(({} as unknown) as Changes)).false;
  });
  it('Returns true if there is a valid change object', () => {
    const isValidChangeMap = changeSetHasCorrectTypes(changes);
    expect(isValidChangeMap).true;
    const isValidEmptyChangeMap = changeSetHasCorrectTypes(new Map());
    expect(isValidEmptyChangeMap).true;
    const isValidNullChange = changeSetHasCorrectTypes(null);
    expect(isValidNullChange).true;
    const isValidUndefinedChange = changeSetHasCorrectTypes(undefined);
    expect(isValidUndefinedChange).true;
    const nullUndefinedContent = new Map();
    nullUndefinedContent.set('null-content', new FileData(null, '100644'));
    const isValidNullContent = changeSetHasCorrectTypes(nullUndefinedContent);
    expect(isValidNullContent).true;
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
