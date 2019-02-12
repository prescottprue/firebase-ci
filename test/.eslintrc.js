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
	rules: {
		"no-unused-expressions": [
			0
		]
	}
}