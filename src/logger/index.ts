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

import {Logger, Level} from 'pino';
import * as Pino from 'pino';
let logger: Logger;

function setupLogger(userLogger?: Logger|Pino.LoggerOptions) {
  if (typeof userLogger === 'undefined' || typeof userLogger === 'object') {
    logger = Pino(userLogger)
  } else if (typeof userLogger === 'function') {
    logger = userLogger as Logger;
  }
}

export {logger, Logger, Level, setupLogger};
