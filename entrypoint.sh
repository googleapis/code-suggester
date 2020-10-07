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

if [[ -z "${INPUT_UPSTREAM_REPO}" ]]
then
    INPUT_UPSTREAM_REPO=$(echo ${GITHUB_REPOSITORY} | cut -d/ -f2)
fi

if [[ -z "${INPUT_UPSTREAM_OWNER}" ]]
then
    INPUT_UPSTREAM_OWNER=$(echo ${GITHUB_REPOSITORY} | cut -d/ -f1)
fi

case "${INPUT_COMMAND}" in
    pr)
        code-suggester pr \
            --upstream-repo="${INPUT_UPSTREAM_REPO}" \
            --upstream-owner="${INPUT_UPSTREAM_OWNER}" \
            --description="${INPUT_DESCRIPTION}" \
            --title="${INPUT_TITLE}" \
            --branch="${INPUT_BRANCH}" \
            --primary="${INPUT_PRIMARY}" \
            --message="${INPUT_MESSAGE}" \
            --force="${INPUT_FORCE}" \
            --maintainers-can-modify="${INPUT_MAINTAINERS_CAN_MODIFY}" \
            --git-dir="${INPUT_GIT_DIR}" \
            --fork="${INPUT_FORK}"
        ;;
    review)
        code-suggester review \
            --upstream-repo="${INPUT_UPSTREAM_REPO}" \
            --upstream-owner="${INPUT_UPSTREAM_OWNER}" \
            --pull-number="${INPUT_PULL_NUMBER}" \
            --git-dir="${INPUT_GIT_DIR}"
        ;;
esac
