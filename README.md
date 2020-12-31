# firebase-ci

> Simplified Firebase interaction for continuous integration

[![NPM version][npm-image]][npm-url]
[![Build Status][build-status-image]][build-status-url]
[![Code Coverage][coverage-image]][coverage-url]
[![License][license-image]][license-url]
<!-- [![semantic-release][semantic-release-icon]][semantic-release-url] -->
[![Code Style][code-style-image]][code-style-url]

## Features

* Deploy to different Firebase projects based on Git Branch
* Automatically use commit message as deploy message
* Expose CI environment variables based on branch name
* Mapping of CI environment variables to Firebase Functions Config
* Optional Deploying of targets Functions, Hosting, Database (rules) and Storage (rules)
* Skip For Pull Requests

## Getting Started

1. Generate a CI token through `firebase-tools` by running `firebase login:ci`
1. Place this token within your CI environment under the variable `FIREBASE_TOKEN`
1. Install `firebase-ci` into your project (so it is available on your CI): `npm install --save-dev firebase-ci firebase-tools`. If you don't want `firebase-tools` as a dev dependency, it can be left out as it is installed automatically if it doesn't exist.
1. Set different Firebase project names in `projects` parameter of `.firebaserc`. The project aliases should match branch names like so:

    ```json
    {
      "projects": {
        "prod": "prod-firebase",
        "master": "dev-firebase",
        "default": "dev-firebase"
      }
    }
    ```

1. Add calls to the scripts within to your CI stages, here are a few example snippets:

      **Github Actions** (*.github/workflows/\*.yml*)
      ```yaml
      jobs:
        deploy:
          name: ${{ matrix.app }} Deploy
          runs-on: ubuntu-18.04
          steps:
            - name: Checkout Code
              uses: actions/checkout@v2
            
            ## Place other steps for installing deps, building, etc. here
            ## See the github-actions example for a full workflow

            # Deploy to Firebase project matching branch name in projects parameter of .firebaserc
            - name: Deploy To Firebase
              run: |
                $(npm bin)/firebase-ci deploy
      ```

      **Travis** (*travis.yml*)
      ```yaml
      script:
        # Deploy to Firebase project matching branch name in projects parameter of .firebaserc
        - $(npm bin)/firebase-ci deploy
      ```

    **NOTES**:
    * `firebase-ci` can be used through the nodejs `bin` **OR** installed globally (npm bin is used here since instructions include adding firebase-ci as a dev dependency)
    * `firebase-tools` will be installed (from `@latest`) if it is not already installed locally or globally


## Setting Project

There are a number of ways to set which Firebase project within `.firebaserc` is being used when running actions. Below is the order of for how the project is determined (default at bottom):

* `FIREBASE_CI_PROJECT` environment variable (overrides all)
* branch name (dependent on CI provider):
  * Github Actions - `GITHUB_HEAD_REF` or `GITHUB_REF` (`refs/heads/` prefix is removed)
  * Travis-CI - `TRAVIS_BRANCH`
  * Gitlab - `CI_COMMIT_REF_SLUG`
  * Circle-CI - `CIRCLE_BRANCH`
  * wercker - `WERCKER_GIT_BRANCH`
  * drone-ci - `DRONE_BRANCH`
  * codeship - `CI_BRANCH`
  * bitbucket - `BITBUCKET_BRANCH`
* fallback name (dependent on CI provider)
  * Gitlab - `CI_ENVIRONMENT_SLUG`
* `master`
* `default` (must be set within `.firebaserc`)


<!-- Uncomment when next version is applicable
## Other Versions
Default installation uses `@latest` tag, but there are also others:

* `react-redux-firebase@next` - upcoming version (currently `v0.2.0` progress)
-->

## [Examples](/examples)

Examples are the same basic html file upload to Firebase hosting of different projects (or "environments") for different CI providers:

* [Travis](/examples/travis)
* [Github Actions](/examples/github-actions)

## Why?

Advanced configuration of Firebase deployment is often necessary when deploying through continuous integration environment. Instead of having to write and invoke your own scripts, `firebase-ci` provides an easy way to  create/modify advanced configurations.

## FAQ

1. What about [Travis's `firebase`](https://docs.travis-ci.com/user/deployment/firebase/) deploy option?

    Using the built in [travis firebase deploy tool](https://docs.travis-ci.com/user/deployment/firebase/) is actually a perfect solution if you want to do general deployment. You can even include the following to install stuff functions dependencies on Travis:

    ```yaml
    after_success:
      - npm install --prefix ./functions

    deploy:
      provider: firebase
      project: $TRAVIS_BRANCH
      skip_cleanup: true
      token:
        secure: $FIREBASE_TOKEN
    ```

    This lets you deploy to whatever instance you want based on your branch (and config in `.firebaserc`).

    `firebase-ci` is for more advanced implementations including only deploying functions, hosting

## Commands

* [`copyVersion`](#createversion) - Copy version from `package.json` to `functions/package.json`
* [`createConfig`](#createconfig) - Create a config file based on CI environment variables (defaults to `src/config.js`)
* [`deploy`](#deploy) - Deploy to Firebase project matching branch name in `.firebaserc` (runs other `firebase-ci` actions by default unless `-s` is passed)
* [`serve`](#serve) - Serve a the Firebase project matching branch name in `.firebaserc` using `firebase serve`
* [`mapEnv`](#mapenv) - Map environment variables from CI Environment to Firebase functions environment
* [`project`](#project) - Output project name associated with CI environment (useful for commands that should be run for each environment)

### copyVersion

It can be convenient for the version within the `functions/package.json` file to match the top level `package.json`. Enabling the `copyVersion` option, automatically copies the version number when calling `deploy` if the following config is provided:

```json
"ci": {
  "copyVersion": true
}
```

### setEnv

Expose environment variables to CI based on current branch.

With a `.firebaserc` that looks like so:

```yaml
"ci": {
  "setEnv": {
    "master": {
      "SOME_VAR": "some value"
      "REACT_APP_ENV_VARIABLE": "val passed to react app"
    },
    "prod": {
      "SOME_VAR": "some other value"
      "REACT_APP_ENV_VARIABLE": "val passed to react app"
    }
  }
}
```

`SOME_VAR` and `REACT_APP_ENV_VARIABLE` will be exposed to environment variables of your CI based on branch. Meaning that on the master branch `SOME_VAR` will be set to `"some value"`

### createConfig

**DEPRECATED**

Create a config file based on CI environment variables (defaults to `src/config.js`). Allows for creating files of different types based on the extension passed.

With the following environment variables:
`GA_TRACKINGID` - Your google analytics tracking id
`INT_FIREBASE_WEBAPIKEY` - API key of your integration/main Firebase instance (this can also be hard coded if you prefer since it doesn't)
`PROD_FIREBASE_WEBAPIKEY` - API key of your production Firebase instance

And a `.firebaserc` that looks like so:

```json
"ci": {
  "createConfig": {
    "master": {
      "version": "${npm_package_version}",
      "gaTrackingId": "${GA_TRACKINGID}",
      "firebase": {
        "apiKey": "${INT_FIREBASE_WEBAPIKEY}",
        "authDomain": "firebase-ci-int.firebaseapp.com",
        "databaseURL": "https://firebase-ci-int.firebaseio.com",
        "projectId": "firebase-ci-int",
        "storageBucket": "firebase-ci-int.appspot.com"
      }
    },
    "prod": {
      "version": "${npm_package_version}",
      "gaTrackingId": "${GA_TRACKINGID}",
      "firebase": {
        "apiKey": "${PROD_FIREBASE_WEBAPIKEY}",
        "authDomain": "firebase-ci.firebaseapp.com",
        "databaseURL": "https://firebase-ci.firebaseio.com",
        "projectId": "firebase-ci",
        "storageBucket": "firebase-ci.appspot.com"
      }
    }
  }
}
```

building on master branch, produces a file in `src/config.js` that looks like so:

```js
export const version = "0.0.1" // or whatever version your package is
export const gaTrackingId = "123GA" // your google analytics tracking ID

export const firebase = {
  apiKey: "<- your app API key ->",
  authDomain: "<- your app name ->.firebaseapp.com",
  databaseURL: "https://<- your app name ->.firebaseio.com",
  projectId: "<- your app name ->",
  storageBucket: "<- your app name ->.appspot.com"
}

export default { version, gaTrackingId, firebase }
```

#### Options

Options can be passed as flags or within an options object if calling action as a function

`--project` - Project within .firebaserc to use when creating config file. Defaults to `"default"` then to `"master"`
`--path` - Path to save the config file. Defaults to src/config.js

### deploy

`firebase-ci deploy`

**Options:**
* [Simple mode](#simple-mode)
* [Info](#info-option)
* [Only](#only-option)

Deploy to Firebase. Following the API of `firebase-tools`, specific targets (i.e. `functions, hosting`) can be specified for deployment.

#### Default

* Everything skipped on Pull Requests
* Deployment goes to default project
* If you have a `functions` folder, `npm install` will be run for you within your `functions` folder
* [`copyVersion`](#copyversion) is called before deployment based on settings in `.firebaserc`, if you don't want this to happen, use simple mode.
* [`mapEnv`](#mapenv) is called before deployment based on settings in `.firebaserc`, if you don't want this to happen, use simple mode.

#### Simple Mode

Option: `--simple`
Flag: `-s`

Skip all `firebase-ci` actions and only run Firebase deployment

#### Info Option

Option : `--info`
Flag: `-i`

Provide extra information from internal actions (including npm install of `firebase-tools`).

#### Only Option

Option : `--only`
Flag: `-o`

Firebase targets to include (passed directly to firebase-tools)

#### Except Option

Option : `--except`

Deploy to all targets except specified (e.g. "database")

#### Force Option

Option : `--force`
Flag: `-f`

Delete Cloud Functions missing from the current working directory without confirmation

##### Skipping Deploying Functions

If you have a functions folder, your functions will automatically deploy as part of using `firebase-ci`. For skipping this functionality, you may use the only flag, similar to the API of `firebase-tools`.

```yaml
script:
  - $(npm bin)/firebase-ci deploy --only hosting
```

### serve

`firebase-ci serve`

**Options:**
* [only](#only-option)

Serve using to `firebase serve`. Following the API of `firebase-tools`, specific targets (i.e. `functions, hosting`) can be specified for serving.

#### Default

* Project alias matching branch name is served
* If there is no matching alias, `default` project is used

#### Only Option

Option : `--only`
Flag: `-o`

Firebase targets to include (passed directly to firebase-tools)

### mapEnv

`firebase-ci mapEnv`

Set Firebase Functions variables based on CI variables. Does not require writing any secure variables within config files.

**NOTE**: Called automatically during `firebase-ci deploy`

Set the `mapEnv` parameter with an object containing the variables you would like to map in the following pattern:

```
TRAVIS_VAR: "firebase.var"
```

##### Example
CI variable is SOME_TOKEN="asdf" and you would like to set it to `some.token` on Firebase Functions you would provide the following config:

```json
"ci": {
  "mapEnv": {
    "SOME_TOKEN": "some.token"
  }
}
```

Internally calls `firebase functions:config:set some.token="asdf"`. This will happen for every variable you provide within mapEnv.

### skipDependenciesInstall

Skip installing of dependencies including `firebase-tools` and `node_modules` within `functions` folder

### skipToolsInstall

Skip installing of `firebase-tools` (installed by default when calling `firebase-ci deploy` without simple mode)

### skipFunctionsInstall

Skip running `npm install` within `functions` folder (`npm install` is called within `functions` folder by default when calling `firebase-ci deploy`).

### project

Get name of project associated with the CI environment

##### Example

```bash
echo "Project to deploy to $(firebase-ci project)"
```

### projectID

Get the projectId associated with the CI environment. Initially loaded from `ci.createConfig.${branchName}.firebase.projectId` and falls back to project from `project` command

##### Example

```bash
echo "Project ID from config $(firebase-ci projectId)"
```

### branch

Get the branch associated with the CI environment (loaded from environment variables)

##### Example

```bash
echo "Branch name from ci env $(firebase-ci branch)"
```

### Roadmap

* `setCORS` option for copying CORS config file to Cloud Storage Bucket
* only setting non existent env vars with `mapEnv`
* Support for Continuous Integration Tools other than Travis-CI

[npm-image]: https://img.shields.io/npm/v/firebase-ci.svg?style=flat-square
[npm-url]: https://npmjs.org/package/firebase-ci
[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/firebase-ci.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/firebase-ci
[coverage-image]: https://img.shields.io/codecov/c/github/prescottprue/firebase-ci.svg?style=flat-square
[coverage-image-next]: https://img.shields.io/codecov/c/github/prescottprue/firebase-ci/next.svg?style=flat-square
[coverage-url]: https://codecov.io/gh/prescottprue/firebase-ci
[license-image]: https://img.shields.io/npm/l/firebase-ci.svg?style=flat-square
[license-url]: https://github.com/prescottprue/firebase-ci/blob/master/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[code-style-url]: http://standardjs.com/
[semantic-release-icon]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[build-status-image-og]: https://github.com/prescottprue/firebase-ci/workflows/NPM%20Package%20Publish/badge.svg?style=flat-square
[build-status-image]: https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fprescottprue%2Ffirebase-ci%2Fbadge&label=build&style=flat-square
[build-status-image-next]: https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fprescottprue%2Ffirebase-ci%2Fbadge%3Fref%3Dnext&label=build&style=flat-square
[build-status-url]: https://github.com/prescottprue/firebase-ci/workflows/publish.yml/badge.svg?branch=next