process.env.NODE_ENV = 'test'

const chai = require('chai')

global.chai = chai
global.expect = chai.expect
global.should = chai.should()
