# @bsi-cx/web-frontend

Standard web frontend library for BSI CX designs.

## Features

* **FieldRules.ts**: Interpreter for dynamic forms (JSON syntax).
  This class uses the [expr-eval](https://www.npmjs.com/package/expr-eval) library, to evaluate expressions defined in the JSON document.
  Check the documentation on the GitHub project page for a full list of supported operators.

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
