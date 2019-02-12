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
		file: true, // chai-files
		dir: true // chai-files
	},
	rules: {
		"no-unused-expressions": [
			0
		]
	}
}