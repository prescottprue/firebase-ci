process.env.NODE_ENV = 'test'

const chai = require('chai')
const sinon = require('sinon')
const chaiFiles = require('chai-files')
const sinonChai = require('sinon-chai')

chai.use(chaiFiles)
chai.use(sinonChai)

global.chai = chai
global.expect = chai.expect
global.should = chai.should()
global.file = chaiFiles.file
global.dir = chaiFiles.dir
global.sinon = sinon
