// TODO [awe] 26.1 dynamic forms: allow to write tests with TypeScript. Currently the test requires the Webpack build
//  to be executed first --> it creates the bundled .js in the /dist folder.
module.exports = function(config) {
  config.set({
    // logLevel: config.LOG_DEBUG,
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      { pattern: 'dist/bsi-cx-web-frontend.js' },
      { pattern: 'tests/**/*.spec.js' }
    ],
    reporters: ['progress'],
    browsers: ['Chrome'] // ['ChromeHeadless'],
  });
};
