[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Code-Suggester: Node.js Client](https://github.com/googleapis/code-suggester)

[![release level](https://img.shields.io/badge/release%20level-alpha-orange.svg?style=flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/@google-cloud/code-suggester.svg)](https://www.npmjs.org/package/@google-cloud/code-suggester)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/code-suggester/master.svg?style=flat)](https://codecov.io/gh/googleapis/code-suggester)




## Description
Code-suggester automates the steps involved in making code changes or code suggestions to your [GitHub](https://github.com/) repository! Code-suggester
1. can be imported as a [library](#Core-Library), or
2. used as a [CLI](#CLI) tool


## Core Library

### Installation

```bash
npm i code-suggester
```

### Example

```
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
|   primary	      |   `string`	| The primary upstream branch to open a PR against. Default is `'master'`.   |
|   message     	|   `string`	| The commit message for the changes. Default is `'code suggestions'`. We recommend following [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).|
|   force	        |   `boolean`	| Whether or not to force push the reference even if the ancestor commits differs. Default is `false`. |



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
The primary upstream branch to open a PR against. Default value is: `'master'`.

#### `--message, -m`
*string* <br>
The GitHub commit message. Default value is: `'code suggestions'`.

#### `--force, -f`
*boolean* <br>
Whether or not to force push a reference with different commit history before the remote reference HEAD. Default value is: `false`.

#### `--git-dir`
*string* <br>
**Required.** The path of a git directory

### Example
```
code-suggester pr -o foo -r bar -d 'description' -t 'title' -m 'message' --git-dir .
```

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

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/code-suggester/blob/master/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/code-suggester/blob/master/LICENSE)



[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing

[auth]: https://cloud.google.com/docs/authentication/getting-started
