import serve from 'actions/serve';

describe('serve action', () => {
  let logSpy;
  beforeEach(() => {
    logSpy = sinon.spy(console, 'log');
  });

  afterEach(() => {
    logSpy && logSpy.restore();
  });

  it('exports a function to be used as a command', () => {
    expect(serve).to.be.an('function');
  });

  it('Logs error saying no config found for provided alias', async () => {
    await serve({ project: 'asdf' });
    // first time with: '⚠ Warning: Skipping firebase-ci serve - Project asdf is not an alias, checking for fallback...'
    // second time with: '⚠ Warning: Skipping firebase-ci serve - Fallback Project: undefined is a not an alias, exiting...'
    expect(logSpy).to.have.been.calledTwice;
  });
});
