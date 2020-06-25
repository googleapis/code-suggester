#!/usr/bin/env node

// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Suggester, CLISuggester} from '../application';
import {Parameters} from '../types';
import * as fs from 'fs';

function hasWriteAccess() {
  try {
    fs.accessSync('.', fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function isNullOrUndefined<T>(value: T) {
  return value === null || value === undefined;
}

async function suggest(params: Parameters) {
  let sugggester: Suggester;
  params.writePermissions = isNullOrUndefined(params.writePermissions)
    ? hasWriteAccess()
    : params.writePermissions;

  sugggester = new CLISuggester(params);
  await sugggester.run();
}

suggest({});

export {suggest};
