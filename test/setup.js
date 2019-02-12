process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiFiles = require('chai-files')

chai.use(chaiFiles)

global.chai = chai
global.expect = chai.expect
global.should = chai.should()
global.file = chaiFiles.file
global.dir = chaiFiles.dir
