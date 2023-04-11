# Changelog

## [4.3.2](https://github.com/googleapis/code-suggester/compare/v4.3.1...v4.3.2) (2023-04-11)


### Bug Fixes

* Configure NullLogger as default logger ([#472](https://github.com/googleapis/code-suggester/issues/472)) ([a5dd35e](https://github.com/googleapis/code-suggester/commit/a5dd35e266dee111006d32314014631242ab95a8))

## [4.3.1](https://github.com/googleapis/code-suggester/compare/v4.3.0...v4.3.1) (2023-02-24)


### Bug Fixes

* **deps:** Update dependency parse-diff to ^0.11.0 ([#451](https://github.com/googleapis/code-suggester/issues/451)) ([da26e41](https://github.com/googleapis/code-suggester/commit/da26e41dc51083a1dc1142e66d0a277534416da9))

## [4.3.0](https://github.com/googleapis/code-suggester/compare/v4.2.0...v4.3.0) (2023-01-25)


### Features

* Introduce CommitSigner interface ([#442](https://github.com/googleapis/code-suggester/issues/442)) ([4801592](https://github.com/googleapis/code-suggester/commit/4801592be9546b207cae9ec6030b2a2d35f5098c))

## [4.2.0](https://github.com/googleapis/code-suggester/compare/v4.1.1...v4.2.0) (2023-01-05)


### Features

* Throw new CommitError if an API error occurs during commit process ([#434](https://github.com/googleapis/code-suggester/issues/434)) ([5ee7f2a](https://github.com/googleapis/code-suggester/commit/5ee7f2ad547a6181aba0f4e8b892335700bf9571))


### Bug Fixes

* **deps:** Update dependency parse-diff to ^0.10.0 ([#430](https://github.com/googleapis/code-suggester/issues/430)) ([06638c2](https://github.com/googleapis/code-suggester/commit/06638c26298a3f948864b8fa18664b540ddc576a))

## [4.1.1](https://github.com/googleapis/code-suggester/compare/v4.1.0...v4.1.1) (2022-11-09)


### Bug Fixes

* Update dependencies ([#424](https://github.com/googleapis/code-suggester/issues/424)) ([32e35df](https://github.com/googleapis/code-suggester/commit/32e35df373977615805b4ad405eea4818c82f274))

## [4.1.0](https://github.com/googleapis/code-suggester/compare/v4.0.1...v4.1.0) (2022-08-24)


### Features

* group commit files into batches ([#398](https://github.com/googleapis/code-suggester/issues/398)) ([e3815d5](https://github.com/googleapis/code-suggester/commit/e3815d58648376d1acbad44dc5cd4637a27daace))

## [4.0.1](https://github.com/googleapis/code-suggester/compare/v4.0.0...v4.0.1) (2022-08-16)


### Bug Fixes

* **action:** run on node16, node14 does not exist ([#392](https://github.com/googleapis/code-suggester/issues/392)) ([a6296cc](https://github.com/googleapis/code-suggester/commit/a6296cc20801720f7e806b9b65fac7854cf59241))

## [4.0.0](https://github.com/googleapis/code-suggester/compare/v3.0.0...v4.0.0) (2022-08-09)


### ⚠ BREAKING CHANGES

* drop Node 12 support
* **action:** upgrade to Node 14
* update @octokit/rest to v19 (#385)

### deps

* update @octokit/rest to v19 ([#385](https://github.com/googleapis/code-suggester/issues/385)) ([aa1b768](https://github.com/googleapis/code-suggester/commit/aa1b768c34af2e8c7f717d8ef66030cdb20bea3e))


### Build System

* **action:** upgrade to Node 14 ([aa1b768](https://github.com/googleapis/code-suggester/commit/aa1b768c34af2e8c7f717d8ef66030cdb20bea3e))
* drop Node 12 support ([aa1b768](https://github.com/googleapis/code-suggester/commit/aa1b768c34af2e8c7f717d8ef66030cdb20bea3e))

## [3.0.0](https://github.com/googleapis/code-suggester/compare/v2.2.0...v3.0.0) (2022-05-17)


### ⚠ BREAKING CHANGES

* update library to use Node 12 (#372)

### Build System

* update library to use Node 12 ([#372](https://github.com/googleapis/code-suggester/issues/372)) ([e9dc15b](https://github.com/googleapis/code-suggester/commit/e9dc15bcdb5c538382236a1dba9792c1df968a35))

## [2.2.0](https://github.com/googleapis/code-suggester/compare/v2.1.4...v2.2.0) (2022-02-28)


### Features

* **action:** build as an javascript action ([#331](https://github.com/googleapis/code-suggester/issues/331)) ([257305d](https://github.com/googleapis/code-suggester/commit/257305dda334af0e9c54b4617df5ec02485ab83e)), closes [#141](https://github.com/googleapis/code-suggester/issues/141)

### [2.1.4](https://github.com/googleapis/code-suggester/compare/v2.1.3...v2.1.4) (2022-02-23)


### Bug Fixes

* **cli:** don't crash when there are no changes ([#334](https://github.com/googleapis/code-suggester/issues/334)) ([e606126](https://github.com/googleapis/code-suggester/commit/e606126e818198bf54881a6fde264e04845ef420)), closes [#229](https://github.com/googleapis/code-suggester/issues/229)
* try to merge the upstream repo branch on the fork ([#330](https://github.com/googleapis/code-suggester/issues/330)) ([2d5c3f9](https://github.com/googleapis/code-suggester/commit/2d5c3f9dd55804fa7e9aa0b776e238cb71776029)), closes [#335](https://github.com/googleapis/code-suggester/issues/335)

### [2.1.3](https://github.com/googleapis/code-suggester/compare/v2.1.2...v2.1.3) (2022-02-22)


### Bug Fixes

* **cli,action:** fix unawaited async call ([#329](https://github.com/googleapis/code-suggester/issues/329)) ([3ef644c](https://github.com/googleapis/code-suggester/commit/3ef644c18c384267b45aa119d80e30729a9cfdfb)), closes [#259](https://github.com/googleapis/code-suggester/issues/259)

### [2.1.2](https://github.com/googleapis/code-suggester/compare/v2.1.1...v2.1.2) (2022-01-19)


### Bug Fixes

* **deps:** update dependency parse-diff to ^0.9.0 ([#303](https://github.com/googleapis/code-suggester/issues/303)) ([25983c9](https://github.com/googleapis/code-suggester/commit/25983c96a99cde0355553ca41a51c9411e988081))

### [2.1.1](https://www.github.com/googleapis/code-suggester/compare/v2.1.0...v2.1.1) (2021-09-03)


### Bug Fixes

* **build:** migrate to main branch ([#262](https://www.github.com/googleapis/code-suggester/issues/262)) ([7bfadc8](https://www.github.com/googleapis/code-suggester/commit/7bfadc861753b717e0929fd4bffdfa4f16eadeca))

## [2.1.0](https://www.github.com/googleapis/code-suggester/compare/v2.0.0...v2.1.0) (2021-05-31)


### Features

* add `gcf-owl-bot[bot]` to `ignoreAuthors` ([#224](https://www.github.com/googleapis/code-suggester/issues/224)) ([3ed8f15](https://www.github.com/googleapis/code-suggester/commit/3ed8f152307d3e197d5ee8445f47fb33ae282cef))

## [2.0.0](https://www.github.com/googleapis/code-suggester/compare/v1.11.0...v2.0.0) (2021-04-26)


### ⚠ BREAKING CHANGES

* This does not actually break any interfaces that are intended to be public (exported in `index.ts`), but would be breaking if you are importing from deeply nested paths which is not intended.
* move custom logger configuration into options (#212)
* cleanup custom logging (#206)

### Features

* cleanup custom logging ([#206](https://www.github.com/googleapis/code-suggester/issues/206)) ([3e4df30](https://www.github.com/googleapis/code-suggester/commit/3e4df304f373eabeb0a3be272be017685a67d90d)), closes [#178](https://www.github.com/googleapis/code-suggester/issues/178) [#183](https://www.github.com/googleapis/code-suggester/issues/183)


### Code Refactoring

* move custom logger configuration into options ([#212](https://www.github.com/googleapis/code-suggester/issues/212)) ([89a1482](https://www.github.com/googleapis/code-suggester/commit/89a1482839e43728e1f1e56d0845058368e9d16c))
* reorganize source code ([#208](https://www.github.com/googleapis/code-suggester/issues/208)) ([5c2edb1](https://www.github.com/googleapis/code-suggester/commit/5c2edb1a75ef394786575cc57afe09fff77932f0))

## [1.11.0](https://www.github.com/googleapis/code-suggester/compare/v1.10.0...v1.11.0) (2021-04-22)


### Features

* add optional draft flag to openPullRequest() ([#207](https://www.github.com/googleapis/code-suggester/issues/207)) ([ff9516c](https://www.github.com/googleapis/code-suggester/commit/ff9516ced31a6b8346b56870e54705412b79f52e))

## [1.10.0](https://www.github.com/googleapis/code-suggester/compare/v1.9.3...v1.10.0) (2021-03-30)


### Features

* add a flag to prevent retries ([#188](https://www.github.com/googleapis/code-suggester/issues/188)) ([aede629](https://www.github.com/googleapis/code-suggester/commit/aede629cf72f60cc7b8bc2f5a2da02b931cf05c9))

### [1.9.3](https://www.github.com/googleapis/code-suggester/compare/v1.9.2...v1.9.3) (2021-03-23)


### Bug Fixes

* **deps:** update to the latest version of octokit ([#181](https://www.github.com/googleapis/code-suggester/issues/181)) ([2c6c89d](https://www.github.com/googleapis/code-suggester/commit/2c6c89dcf3e597c6627b886973910254d2f805ce))

### [1.9.2](https://www.github.com/googleapis/code-suggester/compare/v1.9.1...v1.9.2) (2021-03-15)


### Bug Fixes

* **deps:** update dependency parse-diff to ^0.8.0 ([#177](https://www.github.com/googleapis/code-suggester/issues/177)) ([edce69c](https://www.github.com/googleapis/code-suggester/commit/edce69cc8bcbe9da67b5ae9482369726ad76a1f6))

### [1.9.1](https://www.github.com/googleapis/code-suggester/compare/v1.9.0...v1.9.1) (2021-03-02)


### Bug Fixes

* add labels to action.yaml ([#175](https://www.github.com/googleapis/code-suggester/issues/175)) ([431880b](https://www.github.com/googleapis/code-suggester/commit/431880bc806dc55aac234352a6992e053ed27910))

## [1.9.0](https://www.github.com/googleapis/code-suggester/compare/v1.8.2...v1.9.0) (2021-02-25)


### Features

* support adding labels to PRs ([#173](https://www.github.com/googleapis/code-suggester/issues/173)) ([df55616](https://www.github.com/googleapis/code-suggester/commit/df55616ebc02dc702d828d12b5746830d90e61d4))


### Bug Fixes

* **deps:** update dependency @types/yargs to v16 ([#168](https://www.github.com/googleapis/code-suggester/issues/168)) ([6cc6657](https://www.github.com/googleapis/code-suggester/commit/6cc6657fa5d5580432afd6d76df8e25eb6cff246))

### [1.8.2](https://www.github.com/googleapis/code-suggester/compare/v1.8.1...v1.8.2) (2020-12-08)


### Bug Fixes

* add package-lock.json to fix Docker build ([#161](https://www.github.com/googleapis/code-suggester/issues/161)) ([0d5ecf1](https://www.github.com/googleapis/code-suggester/commit/0d5ecf1256168352b101dd027fa87dfa7bbb742e))

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
