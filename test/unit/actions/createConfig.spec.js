import createConfig from 'actions/createConfig'

describe.skip('createConfig action', () => {
  // TODO: Before with add setting to .firebaserc
  // TODO: After that resets .firebaserc and removes config files
  it('exports a function to be used as a command', () => {
    expect(createConfig).to.be.an('function')
  })

  it('Writes a src/config.js file by default', async () => {
    createConfig({ project: 'test' })
    expect(file('src/config.js')).to.exist
  })

  it('Accepts path config', async () => {
    const otherPath = 'test/one.js'
    createConfig({ path: otherPath })
    expect(file(otherPath)).to.exist
  })
})
