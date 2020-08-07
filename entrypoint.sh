#!/bin/bash
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
--git-dir="$INPUT_GIT_DIR"