module.exports = {
	"extends": "../.eslintrc.js",
	globals: {
		expect: true,
		after: true,
		afterEach: true,
		before: true,
		beforeEach: true,
		it: true,
		describe: true,
		sinon: true, // sinon
		file: true, // chai-files
		dir: true // chai-files
	},
	settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', '/', '../src'],
        extensions: [".js", ".ts"]
      }
    }
  },
	rules: {
		"no-unused-expressions": [0],
		"@typescript-eslint/no-var-requires": 0,
	}
}