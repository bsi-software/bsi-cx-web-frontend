# @bsi-cx/web-frontend

Helper script library for BSI CX designs.

## Features

* **FieldRules.ts**: Interpreter for dynamic forms (JSON syntax).
  This class uses the [expr-eval](https://www.npmjs.com/package/expr-eval) library, to evaluate expressions defined in the JSON document.
  Check the documentation on the GitHub project page for a full list of supported operators.
* **IFrameResizer**: Helper for using cx pages in an iframe.
  The child reports its document height to the parent, and the parent resizes the iFrame accordingly after validating the message origin. 
  Usage is documented in the chapter below.

## Installation

How to install this module in your website project:

```sh
npm install @bsi-cx/web-frontend
```

### Run Tests

We test the built module with Karma, to validate all exported objects work as expected.
The test suite is in plain JavaScript intentionally and simulates the usage in a browser.
If you add API relevant objects to the module, make sure you have written tests for them.

```sh
npm test
```

## IFrame Resizer Usage

Initialize iFrame resizers for parent and child pages:

```js
import { IFrameResizerChild } from '@bsi-cx/web-frontend';

// Manually specified parent origin (recommended for cross-origin-usecases)
IFrameResizerChild.init('https://www.example.com');
// or resolve automatically
IFrameResizerChild.init();
```

In the parent page, pass the iFrame selector and the exact origin of the page loaded inside it:

```js
import { IFrameResizerParent } from '@bsi-cx/web-frontend';

// init with iframe
const iframe = document.querySelector('iframe');
IFrameResizerParent.init(iframe);

// init with iframeSelector
IFrameResizerParent.initSelector('iframe');

// add parent origin for more security
IFrameResizerParent.init(iframe, ['https://my.parent.com']);

```

Use exact origins on both sides. 
Do not use `*` in production.

## How-to publish the module on Npmjs.com

* Check the version number in the package.json and increase it, if needed.
* Use `npm login` in the root directory of the module to connect to the official NPM registry.
* Make sure that the correct registry is used (depends on your .npmrc settings).Force the correct registry with the
  following option:
* `npm login --auth-type=web --registry=https://registry.npmjs.org/`
* Use `npm publish` to publish the module. Example:
* `npm publish --registry=https://registry.npmjs.org/ --access public`
* Enter your NPM username, password, e-mail address (make sure it is the address you use in your NPM profile)
  and finally enter the OTP token, when requested.
