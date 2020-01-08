import { deploy } from '../../src/actions';

describe('firebase-ci Library', () => {
  describe('deployToFirebase function', () => {
    it('exports a function', () => {
      expect(deploy).to.be.an('function');
    });
  });
  describe('deploy option', () => {
    it('exits with message if not in a CI environment', () => {
      deploy({ test: true }, (err, msg) => {
        expect(msg).to.exist;
        expect(msg).to.equal(
          'Skipping Firebase Deploy - Not a supported CI environment',
        );
        expect(err).to.be.null;
      });
    });
    it('accepts project option', () => {
      deploy({ project: 'test' }, (err, msg) => {
        expect(msg).to.exist;
        expect(msg).to.equal(
          'Skipping Firebase Deploy - Branch is not a project alias - Branch: test',
        );
        expect(err).to.be.null;
      });
    });
  });
});
