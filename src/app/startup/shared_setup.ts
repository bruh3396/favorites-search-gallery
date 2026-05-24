import { Root, setupShell } from "../layout/shell";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";
import { setupDomEvents } from "../input/dom_events";
import { setupExtensions } from "../../lib/media/media_extension_resolver";
import { setupServer } from "../../lib/remote/api/api_client";
import { setupStyles } from "../../lib/ui/style";
import { setupSwipeEvents } from "../input/swipe_events";
import { setupTouchHoldEvents } from "../input/touch_hold_events";

export function setupShared(): void {
  setupServer();
  setupDomEvents(ON_FAVORITES_PAGE ? Root : document.documentElement);
  setupTouchHoldEvents();
  setupSwipeEvents();
  setupExtensions();
  setupStyles();
  setupShell();
}
