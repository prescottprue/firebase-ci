# firebase-ci

> Simplified Firebase interaction for continuous integration

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][climate-image]][climate-url]
[![Code Coverage][coverage-image]][coverage-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]

## Features
* Skip For Pull Requests
* Deploy to Different Firebase Instances based on Branch
* Mapping of environment variables from CI environment to Firebase Functions
* Optional Deploying of targets Functions, Hosting, Database (rules) and Storage (rules)

### Roadmap
* `setCORS` option for copying CORS config file to Cloud Storage Bucket
* only setting non existent env vars with `mapEnv`
* Support for Continuous Integration Tools other than Travis-CI

## Getting Started

1. Generate a CI token through `firebase-tools` by running `firebase login:ci`
1. Place this token within your CI environment under the variable `FIREBASE_TOKEN`
1. Install `firebase-ci` into your project (so it is available on your CI): `npm install --save-dev firebase-ci`
1. Add the following scripts to your CI config:

  ```bash
  npm i -g firebase-ci@latest  # install firebase-ci tool
  firebase-ci deploy # deploys only on branches that have a matching project name in .firebaserc
  ```

  For instance within a `travis.yml`:

  ```yaml
  after_success:
    - npm i -g firebase-ci@latest
    - firebase-ci deploy
  ```

1. Set different Firebase instances names to `.firebaserc` like so:
```json
{
  "projects": {
    "prod": "prod-firebase",
    "master": "dev-firebase",
    "default": "dev-firebase"
  }
}
```

## Deploying Functions

If you have a functions folder, your functions will automatically deploy as part of using `firebase-ci`. For skipping this functionality, you may use the only flag, similar to the API of `firebase-tools`.

```yaml
after_success:
  - npm i -g firebase-ci
  - firebase-ci deploy --only hosting
```

## [Examples](/examples)

* [Basic](/examples/basic) - Basic html file upload to Firebase hosting

## Why?
Advanced configuration of Firebase deployment is often necessary when deploying through continuous integration environment. Instead of having to write and invoke your own scripts, `firebase-ci` provides an easy way to  create/modify advanced configurations.

### What about [Travis's `firebase`](https://docs.travis-ci.com/user/deployment/firebase/) deploy option?

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

## Usage

### Default
* Everything skipped on Pull Requests
* Deployment goes to default project
* If you have a `functions` folder, `npm install` will be run for you within your `functions` folder

### Deploying branch to specific instance

Deploying Only On `prod` or `stage` branches when building on Travis CI

non-build branches (currently `prod`, `stage`, and `master`).

```json
"projects": {
  "default": "main-firebase-instance",
  "prod": "main-firebase-instance",
  "int": "integration-instance",
  "test": "testing-firebase-db"
}
```

### Creating a config file
Often times a config file needs to be created specific to each environment for which you are building. To create a config file (writes to  `src/config.js` by default), set `config` parameter:

```js
"ci": {
  "createConfig": {
    "path": "./src/config.js", // './src/config.js' is the default
    "prod": {
      "firebase": {
        "apiKey": "${PROD_FIREBASE_KEY}",
        "authDomain": "${PROD_FIREBASE}.firebaseapp.com",
        "databaseURL": "https://${PROD_FIREBASE}.firebaseio.com",
        "storageBucket": "${PROD_FIREBASE}.appspot.com"
      },
      "reduxFirebase": {
        "userProfile": "users",
        "enableLogging": false
      }
    }
  },
  }
}
```

builds on prod branch result in a `src/config.js` looking like so:

```js
export const firebase = {
  apiKey: '<- actual production firebase key here ->',
  authDomain: 'prod-app.firebaseapp.com',
  databaseURL: 'https://prod-app.firebaseio.com',
  storageBucket: 'prod-app.appspot.com'
}
export const reduxFirebase = {
  userProfile: 'users',
  enableLogging: false,
}
export const env = 'prod' // based on name of parameter
export default { firebase, reduxFirebase, env }

```

### Functions

#### Default Settings

If you have a functions folder, by default, your node modules will be installed for you.

#### copyVersion

It is often convenient for the version within the `functions/package.json` file to match the top level `package.json`. Enabling the `copyVersion` option, automatically copies the version number during the CI build.

```json
"ci": {
  "copyVersion": true
}
```

#### mapEnv

Set Firebase Functions variables based on CI variables. Does not require writing any secure variables within config files.

This is accomplished by setting the `mapEnv` parameter with an object containing the variables you would like to map in the following pattern:

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



[npm-image]: https://img.shields.io/npm/v/firebase-ci.svg?style=flat-square
[npm-url]: https://npmjs.org/package/firebase-ci
[travis-image]: https://img.shields.io/travis/prescottprue/firebase-ci/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/prescottprue/firebase-ci
[daviddm-image]: https://img.shields.io/david/prescottprue/firebase-ci.svg?style=flat-square
[daviddm-url]: https://david-dm.org/prescottprue/firebase-ci
[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/firebase-ci.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/firebase-ci
[coverage-image]: https://img.shields.io/codecov/c/github/prescottprue/firebase-ci.svg?style=flat-square
[coverage-url]: https://codecov.io/gh/prescottprue/firebase-ci
[license-image]: https://img.shields.io/npm/l/firebase-ci.svg?style=flat-square
[license-url]: https://github.com/prescottprue/firebase-ci/blob/master/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[code-style-url]: http://standardjs.com/
