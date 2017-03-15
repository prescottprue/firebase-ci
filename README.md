# firebase-ci

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][climate-image]][climate-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]

## Getting Started


1. Install through(so it is available on your CI): `npm install --save-dev firebase-ci`
<!-- TODO: Mention other options such as after_success -->

2. Add the following script to your CI config:

  ```bash
  node firebase-ci
  ```
This will only run

Make sure you have your `.firebaserc` setup to match branch names you would like
to use such as `master`

## Use Case

Deploying Only On `prod` or `stage` branches when building on Travis CI

## Testing/Coverage

`npm run test` - Run unit tests
`npm run test:cov` - Run unit tests and report coverage

## Building Bundle

Build code before deployment by running `npm run build`

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
