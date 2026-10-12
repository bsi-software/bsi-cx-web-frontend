describe('IFrameResizer', () => {

  const MESSAGE_TYPE = 'iFrameResize';

  let IFrameResizerParent;
  let IFrameResizerChild;

  beforeEach(() => {
    IFrameResizerParent = window.bsiCxWebFrontend.IFrameResizerParent;
    IFrameResizerChild = window.bsiCxWebFrontend.IFrameResizerChild;
  });

  describe('IFrameResizerParent', () => {

    let parents;
    let iframe;

    beforeEach(() => {
      parents = [];
      document.body.replaceChildren();
    });

    afterEach(() => {
      // init() discards the remover returned by _init(), so the 'message' listener
      // would otherwise stay registered for the remaining specs on this page.
      // parents.forEach(parent => parent.removeMessageListener?.());
      document.body.replaceChildren();
    });

    function initSelector(selector, ...allowedOrigins) {
      const parent = IFrameResizerParent.initSelector(selector, allowedOrigins);
      parents.push(parent);
      return parent;
    }

    function init(iframe, ...allowedOrigins) {
      const parent = IFrameResizerParent.init(iframe, allowedOrigins);
      parents.push(parent);
      return parent;
    }

    /**
     * Appends a same-origin iframe (it inherits the origin of the karma context) that exposes a
     * send() helper. The message has to be posted by a script of the iframe itself, otherwise the
     * event source is the karma window instead of the iframe and the parent discards the message.
     */
    function appendIframe(id) {
      return new Promise(resolve => {
        iframe = document.createElement('iframe');
        iframe.id = id;
        iframe.srcdoc = '<!doctype html><html lang="en"><body><script>'
          + 'window.send = (message, targetOrigin) => parent.postMessage(message, targetOrigin);'
          + '</scr' + 'ipt></body></html>';
        iframe.addEventListener('load', () => resolve(iframe), {once: true});
        document.body.appendChild(iframe);
      });
    }

    it('returns an instance for an existing iframe', async () => {
      await appendIframe('customer-iframe');

      const parent = initSelector('#customer-iframe', window.location.origin);

      expect(parent instanceof IFrameResizerParent).toBe(true);
    });

    it('returns an instance for an existing iframe', async () => {
      await appendIframe('customer-iframe');
      let iframe = document.querySelector('#customer-iframe');
      const parent = init(iframe);

      expect(parent instanceof IFrameResizerParent).toBe(true);
    });

    it('warns when no iframe matches the selector', () => {
      spyOn(console, 'warn');

      initSelector('#missing-iframe', window.location.origin);

      expect(console.warn).toHaveBeenCalledWith('Iframe not found with selector:', '#missing-iframe');
    });

    it('applies the height of a message sent by the iframe', async () => {
      await appendIframe('customer-iframe');
      initSelector('#customer-iframe', window.location.origin);
      await postHeight({type: MESSAGE_TYPE, height: 300.2, isChildReloaded: false});
      expect(iframe.style.height).toBe('301px');
    });

    it('ignores a message from a foreign origin', async () => {
      await appendIframe('customer-iframe');
      initSelector('#customer-iframe', 'https://www.example.org');
      await postHeight({type: MESSAGE_TYPE, height: 300, isChildReloaded: false});
      expect(iframe.style.height).toBe('');
    });

    it('ignores a message that is not a height update', async () => {
      await appendIframe('customer-iframe');
      initSelector('#customer-iframe', window.location.origin);
      await postHeight({type: 'someOtherMessage', height: 300, isChildReloaded: false});
      expect(iframe.style.height).toBe('');
    });

    it('scrolls the iframe into view on a reload, but not on the initial page load', async () => {
      await appendIframe('customer-iframe');
      initSelector('#customer-iframe', window.location.origin);
      spyOn(iframe, 'scrollIntoView');
      await postHeight({type: MESSAGE_TYPE, height: 300, isChildReloaded: true});
      expect(iframe.scrollIntoView).not.toHaveBeenCalled();
      await postHeight({type: MESSAGE_TYPE, height: 400, isChildReloaded: true});
      expect(iframe.scrollIntoView).toHaveBeenCalledWith({behavior: 'smooth', block: 'start'});
    });

    /**
     * Lets the iframe post the message and resolves once the parent had the chance to apply the
     * height: the listener registered here fires after the one registered by init(), and the height
     * itself is written in a requestAnimationFrame callback scheduled from that earlier listener.
     */
    function postHeight(message) {
      const applied = new Promise(resolve => {
        window.addEventListener('message', () => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }, {once: true});
      });
      iframe.contentWindow.send(message, window.location.origin);
      return applied;
    }
  });

  describe('IFrameResizerChild', () => {

    let children;
    let originalMinHeight;

    beforeEach(() => {
      children = [];
      originalMinHeight = document.body.style.minHeight;
    });

    afterEach(() => {
      // init() keeps observing document.documentElement, which would keep posting
      // messages to the karma runner for the remaining specs on this page.
      children.forEach(child => child.resizeObserver?.disconnect());
      document.body.style.minHeight = originalMinHeight;
    });

    function init(parentOrigin) {
      const child = IFrameResizerChild.init(parentOrigin);
      children.push(child);
      return child;
    }

    it('returns an instance', () => {
      const child = init(window.location.origin);
      expect(child instanceof IFrameResizerChild).toBe(true);
    });

    it('releases the min-height of the document body', () => {
      // Karma runs the specs inside an iframe, so the child does not bail out on window.self === window.top.
      expect(window.self).not.toBe(window.top);
      init(window.location.origin);
      expect(document.body.style.minHeight).toBe('auto');
      expect(document.body.style.getPropertyPriority('min-height')).toBe('important');
    });
  });

});
