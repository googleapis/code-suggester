[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Code-Suggester: Node.js Client](https://github.com/googleapis/code-suggester)

[![release level](https://img.shields.io/badge/release%20level-alpha-orange.svg?style=flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/@google-cloud/code-suggester.svg)](https://www.npmjs.org/package/@google-cloud/code-suggester)


## Description
Code-suggester automates the steps involved in making code changes or code suggestions to your [GitHub](https://github.com/) repository! Code-suggester
1. can be imported as a [library](#Core-Library), or
2. used as a [CLI](#CLI) tool, or
3. configured in a [GitHub Action](#Action)



## Core Library

### Installation

```bash
npm i code-suggester
```

### Example

```js
const suggester = require("code-suggester");

async function main() {
  const octokit = new Octokit({ auth: process.env.ACCESS_TOKEN });
  const changes =
    {
      'baz.txt':
      {
         mode: '100644',
         content: 'hello world!'
      }
    };
  await suggester.createPullRequest(
    changes,
    octokit,
    'Foo-Repo',
    'Bar-Owner',
  )
}

```
### reviewPullRequest(options)

The `reviewPullRequest()` method creates a code suggestion review on a GitHub Pull request with the files given as input.
From these files, calculate the hunk diff and make all the multiline code suggestion review comments on a given pull request with these hunks given
that they are in scope of the pull request. Outof scope suggestions are not made.

In-scope suggestions are specifically: suggestions whose file is in-scope of the pull request,
and suggestions whose diff hunk is a subset of the pull request's files hunks.
 
 If a file is too large to load in the review, it is skipped in the suggestion phase.

 If the program terminates without exception, a timeline comment will be made with all errors or suggestions that could not be made.

#### Syntax
`reviewPullRequest(octokit, diffContents, config [, logger])`

#### Parameters
#### `octokit`
*octokit* <br>
**Required.** An authenticated [octokit](https://github.com/octokit/rest.js/) instance.

#### `diffContents`
*Map<string, FileDiffContent> | null | undefined* <br>
**Required.** A set of files with their respective original text file content and the new file content.
If the map is null, the empty map, or undefined, a review is not made.
A review is also not made when forall FileDiffContent objects, f,
f.oldContent == f.newContent

**FileDiffContent Object**
|      field      |     type  	|   description	|
|---------------	|-----------	|-------------	|
|   oldContent	|   `string`	| **Required.** The older version of a file.  |
|   newContent	|   `string`	| **Required.** The newer version of a file. |

#### `options`
*Review Pull Request Options Object* <br>
**Required.**

**Review Pull Request Options Object**
|      field      |     type  	|   description	|
|---------------	|-----------	|-------------	|
|   repo	|   `string`	| **Required.** The repository containing the pull request.  |
|   owner	|   `string`	| **Required.** The owner of the repository. |
|   pullNumber	  |   `number`	| **Required.** The GitHub Pull Request number.  |
|   pageSize	  |   `number`	| **Required.** The number of files to return in the pull request list files query. Used when getting data on the remote PR's files. |

#### `logger`
*[Logger](https://www.npmjs.com/package/@types/pino)* <br>
The default logger is [Pino](https://github.com/pinojs/pino). You can plug in any logger that conforms to [Pino's interface](https://www.npmjs.com/package/@types/pino)

#### returns
returns the review number if a review was created, or null if a review was not made and an exception was not thrown.

#### Exceptions
The core-library will throw an exception if the [GitHub V3 API](https://developer.github.com/v3/) returns an error response, or if the response data format did not come back as expected. <br>

### createPullRequest(options)

The `createPullRequest()` method creates a GitHub Pull request with the files given as input.

#### Syntax
`createPullRequest(octokit, changes, config [, logger])`

#### Parameters
#### `octokit`
*octokit* <br>
**Required.** An authenticated [octokit](https://github.com/octokit/rest.js/) instance.

#### `changes`
*Map<string, FileData> | null | undefined* <br>
**Required.** A set of files with their respective file contents conforming where the key is the file path, and the value is the a FileData object. If it is null, the empty map, or undefined, no changes will be made.

**FileData Object**
|  field 	|   type	|   description	|
|---	|---	|---	|
|   mode	|   `'100644' \| '100755' \| '040000' \| '160000' \| '120000'`	|  The file type as specified in the [GitHub API](https://developer.github.com/v3/git/trees/#tree-object). Default is `'100644'`. From the docs: "The file mode; one of 100644 for file (blob), 100755 for executable (blob), 040000 for subdirectory (tree), 160000 for submodule (commit), or 120000 for a blob that specifies the path of a symlink."|
|   content	|  `string \| null` 	|  **Required.** The entire file contents.  	|

#### `options`
*Pull Request Options Object* <br>
**Required.** Descriptive values or enforced rules for pull requests, branching, and commits.

**Pull Request Options Object**
|      field      |     type  	|   description	|
|---------------	|-----------	|-------------	|
|   upstreamRepo	|   `string`	| **Required.** The repository to suggest changes to.  |
|   upstreamOwner	|   `string`	| **Required.** The owner of the upstream repository. |
|   description	  |   `string`	| The GitHub Pull Request description. Default is `'code suggestions'`.  |
|   title       	|   `string`	| The GitHub Pull Request title. Default is `'chore: code suggestions'`.      |
|   branch	      |   `string`	| The branch containing the changes. Default is `'code-suggestions'`.   |
|   primary	      |   `string`	| The primary upstream branch to open a PR against. Default is `'main'`.   |
|   message     	|   `string`	| The commit message for the changes. Default is `'code suggestions'`. We recommend following [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).|
|   force	        |   `boolean`	| Whether or not to force push the reference even if the ancestor commits differs. Default is `false`. |
|   fork	        |   `boolean`	| Whether or not code suggestion should be made from a fork, defaults to `true` (_Note: forking does not work when using `secrets.GITHUB_TOKEN` in an action_). |
|   labels        |   `string[]`| The list of labels to add to the pull request. Default is none. |

#### `logger`
*[Logger](https://www.npmjs.com/package/@types/pino)* <br>
The default logger is [Pino](https://github.com/pinojs/pino). You can plug in any logger that conforms to [Pino's interface](https://www.npmjs.com/package/@types/pino)


#### Exceptions
The core-library will throw an exception if the [GitHub V3 API](https://developer.github.com/v3/) returns an error response, or if the response data format did not come back as expected. <br>

### parseTextFiles(options)

The `parseTextFiles()` method takes a `Map<string, string>` or `Object<string, string>` and outputs the [changes](#changes) object for **text files only**.

#### Syntax
`parseTextFiles(textFiles)`

#### Parameters
#### `textFiles`
*Object<string, string> | Map<string, string>* <br>
**Required.** The key should be the relative file path in the source code, and the value should be the entire file content.


## CLI

### Installation

```bash
npm i code-suggester -g
```

### code-suggester pr
`code-suggester pr` - opens a GitHub Pull Request against the upstream primary branch with the provided set of changes.

#### Syntax

`code-suggester pr [options] --upstream-repo=<string> --upstream-owner=<string>`

#### Environment Variables
#### `ACCESS_TOKEN`
*string* <br>
**Required.** The GitHub access token which has permissions to fork, write to its forked repo and its branches, as well as create Pull Requests on the upstream repository.

#### Options

#### `--upstream-repo, -r`
*string* <br>
**Required.** The repository to create the fork off of.


#### `--upstream-owner, -o`
*string* <br>
**Required.** The owner of the upstream repository.


#### `--description, -d`
*string* <br>
The GitHub Pull Request description. Default value is: `'code suggestions'`.

#### `--title, -t`
*string* <br>
The GitHub Pull Request title. Default value is: `'chore: code suggestions'`.

#### `--branch, -b`
*string* <br>
The GitHub working branch name. Default value is: `'code-suggestions'`.

#### `--primary, -p`
*string* <br>
The primary upstream branch to open a PR against. Default value is: `'main'`.

#### `--message, -m`
*string* <br>
The GitHub commit message. Default value is: `'code suggestions'`.

#### `--force, -f`
*boolean* <br>
Whether or not to force push a reference with different commit history before the remote reference HEAD. Default value is: `false`.

#### `--git-dir`
*string* <br>
**Required.** The path of a git directory

#### `--fork`
*boolean* <br>
Whether or not to attempt forking to a separate repository. Default value is: `true`.

#### `--labels`
*array* <br>
The list of labels to add to the pull request. Default is none.

### Example
```
code-suggester pr -o foo -r bar -d 'description' -t 'title' -m 'message' --git-dir=.
```

### code-suggester review
`code-suggester review` - review an open GitHub Pull Request and suggest changes.

#### Syntax

`code-suggester review --upstream-repo=<string> --upstream-owner=<string> --pull-number=<number> --git-dir=<string>`

#### Environment Variables
#### `ACCESS_TOKEN`
*string* <br>
**Required.** The GitHub access token which has permissions to fork, write to its forked repo and its branches, as well as create Pull Requests on the upstream repository.

#### Options

#### `--upstream-repo, -r`
*string* <br>
**Required.** The repository to create the fork off of.


#### `--upstream-owner, -o`
*string* <br>
**Required.** The owner of the upstream repository.

#### `--pull-number, -p`
*number* <br>
**Required.** The pull request number.

#### `--git-dir`
*string* <br>
**Required.** The path of a git directory

### Example
```
code-suggester pr -o foo -r bar -p 1234 --git-dir=.
```

## Action

### Create a Pull Request
Opens a GitHub Pull Request against the upstream primary branch with the provided git directory. By default the git directory is the same as the `$GITHUB_WORKSPACE` directory.

#### Environment Variables
#### `ACCESS_TOKEN`
*string* <br>
**Required.** The GitHub access token which has permissions to fork, write to its forked repo and its branches, as well as create Pull Requests on the upstream repository. We recommend storing it as a secret in your GitHub repository.

#### Options

#### `upstream_repo`
*string* <br>
**Required.** The repository to create the fork off of.

#### `upstream_owner`
*string* <br>
**Required.** The owner of the upstream repository.

#### `description`
*string* <br>
**Required.** The GitHub Pull Request description.

#### `title`
*string* <br>
**Required.** The GitHub Pull Request title.

#### `branch`
*string* <br>
The GitHub working branch name. Default value is: `'code-suggestions'`.

#### `primary`
*string* <br>
The primary upstream branch to open a PR against. Default value is: `'main'`.

#### `message`
*string* <br>
**Required.** The GitHub commit message.

#### `force`
*boolean* <br>
Whether or not to force push a reference with different commit history before the remote reference HEAD. Default value is: `false`.

#### `maintainers_can_modify`
*boolean* <br>
Whether or not maintainers can modify the pull request. Default value is: `true`.

#### `git_dir`
*string* <br>
**Required.** The path of a git directory. Relative to `$GITHUB_WORKSPACE`.

#### `fork`
*boolean* <br>
Whether or not to attempt forking to a separate repository. Default value is: `true`.

#### `labels`
*array* <br>
The list of labels to add to the pull request. Default is none.

#### Example

The following example is a `.github/workflows/main.yaml` file in repo `Octocat/HelloWorld`. This would add a LICENSE folder to the root `HelloWorld` repo on every pull request if it is not already there.
```yaml
on:
  push:
    branches:
      - main
name: ci
jobs:
  add-license:
    runs-on: ubuntu-latest
    env:
      ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
    steps:
      - uses: actions/checkout@v2
      - name: <YOUR CHANGES> # the physical changes you want to make to your repository
        run: (curl http://www.apache.org/licenses/LICENSE-2.0.txt) > LICENSE # For example adding LICENSE file
      - uses: googleapis/code-suggester@v2 # takes the changes from git directory
        with:
          command: pr
          upstream_owner: Octocat
          upstream_repo: HelloWorld
          description: 'This pull request is adding a LICENSE file'
          title: 'chore(license): add license file'
          message: 'chore(license): add license file'
          branch: my-branch
          git_dir: '.'
          labels: |
            bug
            priority: p1
```

### Review a Pull Request

Suggests changes against an open GitHub Pull Request with changes in the provided git directory. By default the git directory is the same as the `$GITHUB_WORKSPACE` directory.

#### Environment Variables
#### `ACCESS_TOKEN`
*string* <br>
**Required.** The GitHub access token for the user making the suggested changes. We recommend storing it as a secret in your GitHub repository.

#### Options

#### `upstream_repo`
*string* <br>
**Required.** The repository to create the fork off of.

#### `upstream_owner`
*string* <br>
**Required.** The owner of the upstream repository.

#### `pull_number`
*number* <br>
**Required.** The GitHub Pull Request number.

#### `git_dir`
*string* <br>
**Required.** The path of a git directory. Relative to `$GITHUB_WORKSPACE`.

#### Example

The following example is a `.github/workflows/main.yaml` file in repo `Octocat/HelloWorld`. This would run the go formatter on the code and then create a pull request review suggesting `go fmt` fixes.

```yaml
on:
  pull_request_target:
    types: [opened, synchronize]
    branches:
      - main
name: ci
jobs:
  add-license:
    runs-on: ubuntu-latest
    env:
      ACCESS_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{github.event.pull_request.head.ref}}
          repository: ${{github.event.pull_request.head.repo.full_name}}
      - name: format
        run: go fmt
      - uses: googleapis/code-suggester@v2 # takes the changes from git directory
        with:
          command: review
          pull_number: ${{ github.event.pull_request.number }}
          git_dir: '.'
```

**Important**: When using `pull_request_target` and `actions/checkout` with the pull
request code, make sure that an external developer cannot override the commands run
from the pull request.

## Supported Node.js Versions

Our client libraries follow the [Node.js release schedule](https://nodejs.org/en/about/releases/).
Libraries are compatible with all current _active_ and _maintenance_ versions of
Node.js.

Client libraries targeting some end-of-life versions of Node.js are available, and
can be installed via npm [dist-tags](https://docs.npmjs.com/cli/dist-tag).
The dist-tags follow the naming convention `legacy-(version)`.

_Legacy Node.js versions are supported as a best effort:_

* Legacy versions will not be tested in continuous integration.
* Some security patches may not be able to be backported.
* Dependencies will not be kept up-to-date, and features will not be backported.

#### Legacy tags available

* `legacy-8`: install client libraries from this dist-tag for versions
  compatible with Node.js 8.


## Versioning

This library follows [Semantic Versioning](http://semver.org/).


This library is considered to be in **alpha**. This means it is still a
work-in-progress and under active development. Any release is subject to
backwards-incompatible changes at any time.

More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/code-suggester/blob/main/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/code-suggester/blob/main/LICENSE)



[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing

[auth]: https://cloud.google.com/docs/authentication/getting-started
