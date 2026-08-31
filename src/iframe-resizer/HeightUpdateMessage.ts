/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
export interface HeightUpdateMessage {
  type: "iFrameHeightUpdate";
  height: number;
  isChildReloaded: boolean;
}
