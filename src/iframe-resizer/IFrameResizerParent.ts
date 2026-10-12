/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
import {MESSAGE_TYPE, IFrameResizerMessage} from './IFrameResizerMessage';

export class IFrameResizerParent {
  private allowedOrigins: ReadonlySet<string>;
  private removeMessageListener?: () => void;
  private iframe: HTMLIFrameElement;

  constructor(iframe: HTMLIFrameElement, allowedOrigins?: string | string[]) {
    this.iframe = iframe;
    let srcOrigin = new URL(iframe.src || window.location.origin ).origin;
    allowedOrigins = !allowedOrigins ? [srcOrigin] : typeof allowedOrigins === 'string' ? [allowedOrigins] : allowedOrigins;
    this.allowedOrigins = new Set(allowedOrigins || [srcOrigin]);
  }

  protected _init(): () => void {
    this.removeMessageListener?.();
    let previousAnimationRequestId: number | null = null;
    let isInitialPageLoad = true;
    const handleMessage = (event: MessageEvent<unknown>): void => {
      if (!this.allowedOrigins.has(event.origin) || event.source !== this.iframe.contentWindow) {
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
        this.iframe.style.height = `${Math.ceil(height)}px`;
        if (data.isChildReloaded) {
          if (isInitialPageLoad) {
            isInitialPageLoad = false;
          } else {
            this.iframe.scrollIntoView({behavior: 'smooth', block: 'start'});
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
    return (
      message.type === MESSAGE_TYPE &&
      typeof message.height === 'number' &&
      typeof message.isChildReloaded === 'boolean'
    );
  }

  static initSelector(iframeSelector: string, ...allowedOrigins: string[]): IFrameResizerParent | undefined {
    let iframe = document.querySelector<HTMLIFrameElement>(iframeSelector);
    if (!iframe) {
      console.warn('Iframe not found with selector:', iframeSelector);
      return undefined;
    }
    let resizerParent = new IFrameResizerParent(iframe, allowedOrigins);
    resizerParent._init();
    return resizerParent;
  }

  static init(iframe: HTMLIFrameElement, ...allowedOrigins: string[]): IFrameResizerParent {
    let resizerParent = new IFrameResizerParent(iframe, allowedOrigins);
    resizerParent._init();
    return resizerParent;
  }
}
