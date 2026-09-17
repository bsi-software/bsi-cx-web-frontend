/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
import {MESSAGE_TYPE, IFrameResizerMessage} from './IFrameResizerMessage';

export class IFrameResizerParent {

  private allowedOrigins: ReadonlySet<string>;
  private removeMessageListener?: () => void;
  private iframeSelector: string;

  constructor(iframeSelector: string, allowedOrigins: string | string[]) {
    const origins = typeof allowedOrigins === 'string' ? [allowedOrigins] : allowedOrigins;
    this.iframeSelector = iframeSelector;
    this.allowedOrigins = new Set(origins);
  }

  protected _init(): () => void {
    this.removeMessageListener?.();

    const iframe = document.querySelector<HTMLIFrameElement>(this.iframeSelector);
    if (!iframe) {
      console.warn('Iframe not found with selector:', this.iframeSelector);
      return () => undefined;
    }

    let previousAnimationRequestId: number | null = null;
    let isInitialPageLoad = true;
    const handleMessage = (event: MessageEvent<unknown>): void => {
      if (!this.allowedOrigins.has(event.origin) || event.source !== iframe.contentWindow) {
        return;
      }
      if (!this.isHeightUpdateMessage(event.data)) {
        return;
      }
      const data = event.data;
      const height = Number(data.height);
      if (!Number.isFinite(height)) {
        return;
      }
      if (previousAnimationRequestId !== null) {
        cancelAnimationFrame(previousAnimationRequestId);
      }

      previousAnimationRequestId = requestAnimationFrame(() => {
        previousAnimationRequestId = null;
        iframe.style.height = `${Math.ceil(height)}px`;
        if (data.isChildReloaded) {
          if (isInitialPageLoad) {
            isInitialPageLoad = false;
          } else {
            iframe.scrollIntoView({behavior: 'smooth', block: 'start'});
          }
        }
      });
    };

    window.addEventListener('message', handleMessage);
    const removeListener = (): void => {
      if (previousAnimationRequestId !== null) {
        cancelAnimationFrame(previousAnimationRequestId);
      }
      window.removeEventListener('message', handleMessage);
    };
    this.removeMessageListener = removeListener;
    return removeListener;
  }

  protected isHeightUpdateMessage(data: unknown): data is IFrameResizerMessage {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const message = data as Partial<IFrameResizerMessage>;
    return message.type === MESSAGE_TYPE
      && typeof message.height === 'number'
      && typeof message.isChildReloaded === 'boolean';
  }

  static init(iframeSelector: string, allowedOrigins: string | string[]): IFrameResizerParent {
    let resizerParent = new IFrameResizerParent(iframeSelector, allowedOrigins);
    resizerParent._init();
    return resizerParent;
  }
}


