# Changelog

### [1.8.1](https://www.github.com/googleapis/code-suggester/compare/v1.8.0...v1.8.1) (2020-11-11)


### Bug Fixes

* **deps:** update dependency diff to v5 ([#155](https://www.github.com/googleapis/code-suggester/issues/155)) ([b923ec4](https://www.github.com/googleapis/code-suggester/commit/b923ec436ed2761ca3e775e110ec693655977cf6))

## [1.8.0](https://www.github.com/googleapis/code-suggester/compare/v1.7.0...v1.8.0) (2020-10-09)


### Features

* **review:** allow raw diff for reviewPullRequest ([#137](https://www.github.com/googleapis/code-suggester/issues/137)) ([841526d](https://www.github.com/googleapis/code-suggester/commit/841526d720b6af4a21cf3ab08e5749a812fb5c30))


### Bug Fixes

* handle addition-only and deletion-only changes ([#144](https://www.github.com/googleapis/code-suggester/issues/144)) ([ab936a2](https://www.github.com/googleapis/code-suggester/commit/ab936a251171ca5aafc160f3506db54a7cb31e8a)), closes [#126](https://www.github.com/googleapis/code-suggester/issues/126) [#127](https://www.github.com/googleapis/code-suggester/issues/127)
* the review comment should go on the old file lines, not the new file lines ([#140](https://www.github.com/googleapis/code-suggester/issues/140)) ([662391f](https://www.github.com/googleapis/code-suggester/commit/662391f2ae18e8ec997e0961430ce3ccc6f11cee))

## [1.7.0](https://www.github.com/googleapis/code-suggester/compare/v1.6.0...v1.7.0) (2020-10-07)


### Features

* **action:** action can now review pull requests ([#135](https://www.github.com/googleapis/code-suggester/issues/135)) ([c90a128](https://www.github.com/googleapis/code-suggester/commit/c90a128bb4e808ed3a1a8212eb4aac2e1179792d))
* **cli:** add command for reviewing a pr ([#130](https://www.github.com/googleapis/code-suggester/issues/130)) ([ffac451](https://www.github.com/googleapis/code-suggester/commit/ffac45171c68f67c75858866c51cb0dec9993141))


### Bug Fixes

* **action:** default upstream owner/repo to the current repo ([#131](https://www.github.com/googleapis/code-suggester/issues/131)) ([3dd762a](https://www.github.com/googleapis/code-suggester/commit/3dd762a49f6c42b6a652f3420d842a43f3744c3f)), closes [#73](https://www.github.com/googleapis/code-suggester/issues/73)
* handle single line comments and add newline ([#128](https://www.github.com/googleapis/code-suggester/issues/128)) ([1526a40](https://www.github.com/googleapis/code-suggester/commit/1526a40de4d18765fc9343356f2be70e9af068a2))
* range parsing ([#125](https://www.github.com/googleapis/code-suggester/issues/125)) ([4993d62](https://www.github.com/googleapis/code-suggester/commit/4993d62f3e37d23b3cda83516c2dc6879464132f))

## [1.6.0](https://www.github.com/googleapis/code-suggester/compare/v1.5.0...v1.6.0) (2020-09-25)


### Features

* **framework-core:** support inline multiline comments suggestions on pull requests ([#105](https://www.github.com/googleapis/code-suggester/issues/105)) ([415fb8a](https://www.github.com/googleapis/code-suggester/commit/415fb8ae6283dc09c6283c5bbb3ce92114dbf84b)), closes [#83](https://www.github.com/googleapis/code-suggester/issues/83) [#84](https://www.github.com/googleapis/code-suggester/issues/84) [#86](https://www.github.com/googleapis/code-suggester/issues/86) [#89](https://www.github.com/googleapis/code-suggester/issues/89) [#91](https://www.github.com/googleapis/code-suggester/issues/91) [#90](https://www.github.com/googleapis/code-suggester/issues/90) [#93](https://www.github.com/googleapis/code-suggester/issues/93) [#114](https://www.github.com/googleapis/code-suggester/issues/114) [#116](https://www.github.com/googleapis/code-suggester/issues/116) [#117](https://www.github.com/googleapis/code-suggester/issues/117)

## [1.5.0](https://www.github.com/googleapis/code-suggester/compare/v1.4.0...v1.5.0) (2020-09-10)


### Features

* **cli,action:** enable configuring --fork option ([#109](https://www.github.com/googleapis/code-suggester/issues/109)) ([fd77d4a](https://www.github.com/googleapis/code-suggester/commit/fd77d4aef388bb7948418dc4a2eef21610520f71))


### Bug Fixes

* **deps:** update dependency yargs to v16 ([#111](https://www.github.com/googleapis/code-suggester/issues/111)) ([8a1ec95](https://www.github.com/googleapis/code-suggester/commit/8a1ec9575c46398cb7cf633a6a6bea7f79b99d37))

## [1.4.0](https://www.github.com/googleapis/code-suggester/compare/v1.3.0...v1.4.0) (2020-09-08)


### Features

* make forking functionality optional ([#101](https://www.github.com/googleapis/code-suggester/issues/101)) ([1a25661](https://www.github.com/googleapis/code-suggester/commit/1a256613cf7bb9dad0e7b9480b2f8af5bc08e340))


### Bug Fixes

* listBranches fails if repo has many branches ([#102](https://www.github.com/googleapis/code-suggester/issues/102)) ([eda2336](https://www.github.com/googleapis/code-suggester/commit/eda2336acb72ebb4d8e4ac6b88ab742d4e4d9bcd))

## [1.3.0](https://www.github.com/googleapis/code-suggester/compare/v1.2.0...v1.3.0) (2020-09-04)


### Features

* **logging:** allow pino to be configured ([#97](https://www.github.com/googleapis/code-suggester/issues/97)) ([d45e474](https://www.github.com/googleapis/code-suggester/commit/d45e474b534d28d08f3872a4f1bcc4969e6ff8bb))
* **types:** make Changes type public ([#98](https://www.github.com/googleapis/code-suggester/issues/98)) ([8df9310](https://www.github.com/googleapis/code-suggester/commit/8df9310fdcda98d9f18366684adda02253bd0c06))

## [1.2.0](https://www.github.com/googleapis/code-suggester/compare/v1.1.1...v1.2.0) (2020-09-02)


### Features

* return the PR number created ([#95](https://www.github.com/googleapis/code-suggester/issues/95)) ([43bf6de](https://www.github.com/googleapis/code-suggester/commit/43bf6de31422729529e5d55f4e4382722fdcbb1b))

### [1.1.1](https://www.github.com/googleapis/code-suggester/compare/v1.1.0...v1.1.1) (2020-08-13)


### Bug Fixes

* **cli,action:** when process fails, make exit code 1 ([#81](https://www.github.com/googleapis/code-suggester/issues/81)) ([c1495cb](https://www.github.com/googleapis/code-suggester/commit/c1495cb5010c6df55ef91616d0a1c3e5a508ffc7)), closes [#72](https://www.github.com/googleapis/code-suggester/issues/72)
* **framework-core:** retry mechanism for when forked git object isn't quite ready ([#78](https://www.github.com/googleapis/code-suggester/issues/78)) ([326145f](https://www.github.com/googleapis/code-suggester/commit/326145f138dbd50ba455175c473a58d5717aeafe))

## [1.1.0](https://www.github.com/googleapis/code-suggester/compare/v1.0.1...v1.1.0) (2020-08-07)


### Features

* **action:** setup configuration for GitHub actions ([#69](https://www.github.com/googleapis/code-suggester/issues/69)) ([b879d75](https://www.github.com/googleapis/code-suggester/commit/b879d75c8b051a4cfd0a19088946f496b4beaeb0))


### Bug Fixes

* **core-library:** do not create pr when a pr already exists for a ref ([#66](https://www.github.com/googleapis/code-suggester/issues/66)) ([4c7b259](https://www.github.com/googleapis/code-suggester/commit/4c7b259e7025d5a5a4357cbb588a7cfa66869023)), closes [#17](https://www.github.com/googleapis/code-suggester/issues/17)

### [1.0.1](https://www.github.com/googleapis/code-suggester/compare/v1.0.0...v1.0.1) (2020-08-04)


### Bug Fixes

* command and public package alias ([#61](https://www.github.com/googleapis/code-suggester/issues/61)) ([79b540d](https://www.github.com/googleapis/code-suggester/commit/79b540d72011ac98089374d5504b07d4546020dd))

## 1.0.0 (2020-08-04)


### Features

* basic pr opening ([#33](https://www.github.com/googleapis/code-suggester/issues/33)) ([2be3e59](https://www.github.com/googleapis/code-suggester/commit/2be3e59104d44dfa21ca3a16a263f6ebde76a397))
* commit and push changes onto a SHA to a target remote ([#30](https://www.github.com/googleapis/code-suggester/issues/30)) ([8bf1782](https://www.github.com/googleapis/code-suggester/commit/8bf178237a3b2b0a728d5bcc10b1db6e11c3f925)), closes [#19](https://www.github.com/googleapis/code-suggester/issues/19)
* create a branch from origin owner, repo, branch name, and an optional primary branch ([#27](https://www.github.com/googleapis/code-suggester/issues/27)) ([fecaaba](https://www.github.com/googleapis/code-suggester/commit/fecaabaefc923ec72449dfc6ab59f43536610cf2))
* forking with octokit given repo and owner ([#20](https://www.github.com/googleapis/code-suggester/issues/20)) ([eb9047f](https://www.github.com/googleapis/code-suggester/commit/eb9047f091c163fd420d498d5aa9ad434cdba3b9))
* **cli:** cli interface ([#53](https://www.github.com/googleapis/code-suggester/issues/53)) ([836e0bc](https://www.github.com/googleapis/code-suggester/commit/836e0bc5b4cd4aa77c7e7a07d972340a4ea47b1a))
* **core:** create a GitHub Pull Request from a fork ([#45](https://www.github.com/googleapis/code-suggester/issues/45)) ([782bced](https://www.github.com/googleapis/code-suggester/commit/782bcede3ccdaac5f0955f9da3d4d5752e32a364))


### Bug Fixes

* increase number of approvers ([#56](https://www.github.com/googleapis/code-suggester/issues/56)) ([e1f69e2](https://www.github.com/googleapis/code-suggester/commit/e1f69e2f0b4b7436b3005f84d29a6ae3a716d4f8))
* typeo in nodejs .gitattribute ([#22](https://www.github.com/googleapis/code-suggester/issues/22)) ([b649ddc](https://www.github.com/googleapis/code-suggester/commit/b649ddc7bc42778bc668025c33f1c6f0a2025e18))
