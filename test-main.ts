const allFiles = (window as any).__karma__.files;

const testModules = Object.keys(allFiles).filter(file =>
  file.endsWith('.spec.js') && file.startsWith('/base/tests/')
);
console.log('Test modules:', testModules);

const imports = testModules.map(file => import(file));

// Prevent Karma from auto-starting tests
(window as any).__karma__.loaded = function () {};

Promise.all(imports)
  .then(() => (window as any).__karma__.start())
  .catch((err) => {
    console.error('Test module loading failed:', err);
    (window as any).__karma__.error(err);
  });
