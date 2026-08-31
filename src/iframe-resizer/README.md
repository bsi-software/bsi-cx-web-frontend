# Iframe resizing

Install the package in the website and initialize the parent and child resizers:

```sh
npm install @bsi-cx/web-frontend
```

```js
import { initResizerChild } from '@bsi-cx/web-frontend';

initResizerChild('https://www.example.com');
```

In the parent page, pass the iframe selector and the exact origin of the page loaded inside it:

```js
import { initResizerParent } from '@bsi-cx/web-frontend';

initResizerParent('#customer-iframe', 'https://cx.customer.com');
```

Use exact origins on both sides. Do not use `*` in production.