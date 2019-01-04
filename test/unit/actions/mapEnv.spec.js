import mapEnv from 'actions/mapEnv'
import { to } from 'utils/async'

describe('mapEnv action', () => {
  it('exports a function to be used as a command', () => {
    expect(mapEnv).to.be.an('function')
  })

  it('Exits if there are no settings', async () => {
    const [err] = await to(mapEnv())
    expect(err).to.be.null
  })

  it('Accepts settings passed to it', async () => {
    const [err] = await to(mapEnv({ map: 'env' }))
    expect(err).to.be.null
  })
})
