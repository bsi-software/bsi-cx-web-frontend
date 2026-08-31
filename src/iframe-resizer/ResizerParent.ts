/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
import type { HeightUpdateMessage } from './HeightUpdateMessage';

export class ResizerParent {
    private readonly allowedOrigins: ReadonlySet<string>;
    private removeMessageListener?: () => void;

    constructor(
        private readonly iframeSelector: string,
        allowedOrigins: string | readonly string[],
    ) {
        const origins = typeof allowedOrigins === 'string'
            ? [allowedOrigins]
            : allowedOrigins;
        this.allowedOrigins = new Set(origins);
    }

    public init(): () => void {
        this.removeMessageListener?.();

        const iframe = document.querySelector<HTMLIFrameElement>(this.iframeSelector);
        if (!iframe) {
            console.warn('Iframe not found with selector:', this.iframeSelector);
            return () => undefined;
        }

        let previousAnimationRequestId: number | null = null;
        let isInitialPageLoad = true;
        const handleMessage = (event: MessageEvent<unknown>): void => {
            if (!this.allowedOrigins.has(event.origin) || event.source !== iframe.contentWindow) return;

            if (!isHeightUpdateMessage(event.data)) return;
            const data = event.data;

            const height = Number(data.height);
            if (!Number.isFinite(height)) return;

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
                        iframe.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
}

function isHeightUpdateMessage(data: unknown): data is HeightUpdateMessage {
    if (typeof data !== 'object' || data === null) return false;

    const message = data as Partial<HeightUpdateMessage>;
    return message.type === 'iFrameHeightUpdate'
        && typeof message.height === 'number'
        && typeof message.isChildReloaded === 'boolean';
}

export function initResizerParent(
    iframeSelector: string,
    allowedOrigins: string | readonly string[],
): () => void {
    return new ResizerParent(iframeSelector, allowedOrigins).init();
}