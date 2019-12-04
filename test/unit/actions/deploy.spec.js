import deploy from 'actions/deploy'

describe('deploy action', () => {
  let logSpy
  beforeEach(() => {
    logSpy = sinon.spy(console, 'log')
  })

  afterEach(() => {
    logSpy && logSpy.restore()
  })

  it('exports a function to be used as a command', () => {
    expect(deploy).to.be.an('function')
  })

  it('Logs error saying no config found for provided alias', async () => {
    await deploy({ project: 'asdf' })
    // first time with: 'ℹ Skipping Firebase Deploy - Project asdf is not an alias, checking for fallback...'
    // second time with: 'ℹ Skipping Firebase Deploy - Fallback Project: undefined is a not an alias, exiting...'
    expect(logSpy).to.have.been.calledTwice
  })
})
