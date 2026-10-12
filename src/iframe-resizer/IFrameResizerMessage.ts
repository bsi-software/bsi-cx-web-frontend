/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */

/**
 * Type constant for {@link IFrameResizerMessage} POST messages.
 */
export const MESSAGE_TYPE = 'iFrameResize';

/**
 * Message type used to pass POST messages between IFrameResizer parent and child.
 */
export interface IFrameResizerMessage {
  type: typeof MESSAGE_TYPE;
  height: number;
  isChildReloaded: boolean;
}
