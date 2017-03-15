# firebase-ci

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][climate-image]][climate-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]

> Simplified Firebase interaction for continuous integration


## Features
* Skip For Pull Requests
* Deploy to Different Firebase Instances based on Branch (such as `prod` and `stage`)
* Optional Deploying of targets Functions, Hosting, Database (rules) and Storage (rules)

## Getting Started

1. Generate a CI token through `firebase-tools` by running `firebase login:ci`
1. Place this token within your CI environment under the variable `FIREBASE_TOKEN`
1. Install `firebase-ci` into your project (so it is available on your CI): `npm install --save-dev firebase-ci`
1.. Add the following script to your CI config:

  ```bash
  firebase-ci deploy
  ```

For instance within a `travis.yml`:

  ```yaml
  after_success:
    - firebase-ci deploy
  ```

3. Set different Firebase instances names to `.firebaserc` like so:
```
{
  "projects": {
    "prod": "prod-firebase",
    "master": "dev-firebase",
    "default": "dev-firebase"
  }
}
```


### Coming Soon
* Configuration of whitelisted branches
* Deploying only a single function at a time
* Support for Continuous Integration Tools other than Travis-CI

## Use Case

Deploying Only On `prod` or `stage` branches when building on Travis CI

Skips Pull Requests and non-build branches (currently `prod`, `stage`, and `master`).

## Deploying Functions

In order for Firebase Functions to successfully install, you will need to allow the dependencies to install by running `npm install --prefix ./functions`

```
after_success:
  - npm install --prefix ./functions
  - firebase-ci deploy --only functions
```

**NOTE** This will be included by default soon, and will no longer be necessary


## Travis Has `firebase` deploy option?

Using the built in travis deploy tool is actually a perfect solution if you want to do general deployment. You can even include the following to install stuff functions dependencies on Travis:

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

### Tests

`npm run test` - run tests
`npm run test:cov` - run tests and generate coverage

## [Documentation](https://prescottprue.github.com/firebase-ci)

[npm-image]: https://img.shields.io/npm/v/firebase-ci.svg?style=flat-square
[npm-url]: https://npmjs.org/package/firebase-ci
[travis-image]: https://img.shields.io/travis/prescottprue/firebase-ci/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/prescottprue/firebase-ci
[daviddm-image]: https://img.shields.io/david/prescottprue/firebase-ci.svg?style=flat-square
[daviddm-url]: https://david-dm.org/prescottprue/firebase-ci
[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/firebase-ci.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/firebase-ci
[coverage-image]: https://img.shields.io/codeclimate/coverage/github/prescottprue/firebase-ci.svg?style=flat-square
[coverage-url]: https://codeclimate.com/github/prescottprue/firebase-ci
[license-image]: https://img.shields.io/npm/l/firebase-ci.svg?style=flat-square
[license-url]: https://github.com/prescottprue/firebase-ci/blob/master/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[code-style-url]: http://standardjs.com/
