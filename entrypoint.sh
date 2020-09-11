#!/bin/bash

# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https:#www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

code-suggester $INPUT_COMMAND \
--upstream-repo="$INPUT_UPSTREAM_REPO" \
--upstream-owner="$INPUT_UPSTREAM_OWNER" \
--description="$INPUT_DESCRIPTION" \
--title="$INPUT_TITLE" \
--branch="$INPUT_BRANCH" \
--primary="$INPUT_PRIMARY" \
--message="$INPUT_MESSAGE" \
--force="$INPUT_FORCE" \
--maintainers-can-modify="$INPUT_MAINTAINERS_CAN_MODIFY" \
--git-dir="$INPUT_GIT_DIR" \
--fork="$INPUT_FORK"