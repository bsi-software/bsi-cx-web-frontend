/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
import {MESSAGE_TYPE, IFrameResizerMessage} from './IFrameResizerMessage';

export class IFrameResizerChild {

  private lastHeight = 0;
  private initialLoad = true;
  private resizeObserver: ResizeObserver;

  constructor(parentOrigin: string, heightThreshold = 1) {
    this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const newHeight = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      if (Math.abs(newHeight - this.lastHeight) < heightThreshold) {
        return;
      }

      this.lastHeight = newHeight;
      const message: IFrameResizerMessage = {
        type: MESSAGE_TYPE,
        height: newHeight,
        isChildReloaded: this.initialLoad,
      };
      window.parent.postMessage(message, parentOrigin);
      this.initialLoad = false;
    });
  }

  protected _init(): void {
    if (window.self === window.top) {
      return;
    }
    const observe = (): void => {
      document.body.style.setProperty('min-height', 'auto', 'important');
      this.resizeObserver.observe(document.documentElement);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observe, {once: true});
    } else {
      observe();
    }
  }

  static init(parentOrigin: string, heightThreshold = 1): IFrameResizerChild {
    const resizer = new IFrameResizerChild(parentOrigin, heightThreshold);
    resizer._init();
    return resizer;
  }
}
