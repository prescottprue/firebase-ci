import createConfig from 'actions/createConfig'
import { writeFileSync, unlinkSync } from 'fs'

const configFilePath = `${process.cwd()}/.firebaserc`
const testConfigRf = {
  ci: {
    projects: {
      default: 'tester-2d4fa'
    },
    createConfig: {
      test: {
        some: 'field'
      }
    }
  }
}

describe('createConfig action', () => {
  let logSpy
  beforeEach(() => {
    logSpy = sinon.spy(console, 'log')
  })

  afterEach(() => {
    logSpy && logSpy.restore()
  })

  it('exports a function to be used as a command', () => {
    expect(createConfig).to.be.an('function')
  })

  describe('when there are no settings in ci.createConfig', () => {
    it('Exits early (no log) and returns undefined', async () => {
      const res = createConfig({ project: 'test' })
      expect(res).to.be.undefined
      // '✖ Error: no createConfig settings found'
      expect(logSpy).to.have.been.calledTwice
    })
  })

  describe('when there are settings in ci.createConfig', () => {
    before(() => {
      // Add .firebaserc config file
      writeFileSync(configFilePath, JSON.stringify(testConfigRf))
    })

    after(() => {
      // Remove config file
      unlinkSync(configFilePath)
    })

    it('Logs error saying no config found for provided alias', async () => {
      expect(() => createConfig({ project: 'asdf' })).to.Throw(
        'Valid create config settings could not be loaded'
      )
    })

    it.skip('Writes a src/config.js file by default', async () => {
      createConfig({ project: 'test' })
      expect(file('src/config.js')).to.exist
    })

    it.skip('Accepts path config', async () => {
      const otherPath = 'test/one.js'
      createConfig({ path: otherPath })
      expect(file(otherPath)).to.exist
    })
  })
})
