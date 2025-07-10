module.exports = function(config) {
  config.set({
    // logLevel: config.LOG_DEBUG,
    basePath: '',
    frameworks: ['jasmine', 'karma-typescript'],
    files: [
      { pattern: 'test-main.ts' },
      { pattern: 'tests/**/*.spec.ts', included: false },
      { pattern: 'src/**/*.ts', included: false }
    ],
    preprocessors: {
      'test-main.ts': ['karma-typescript'],
      'tests/**/*.spec.ts': ['karma-typescript'],
      'src/**/*.ts': ['karma-typescript']
    },
    reporters: ['progress', 'karma-typescript'],
    browsers: ['Chrome'], // ['ChromeHeadless'],
    singleRun: true,
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.test.json',
      bundlerOptions: {
        sourceMap: true,
        transforms: [
          require("karma-typescript-es6-transform")()
        ],
        entrypoints: /test-main\.ts$/
      },
    }
  });
};
