import { Root, setupShell } from "./shell";
import { ON_FAVORITES_PAGE } from "./environment/environment";
import { setupDomEvents } from "./communication/dom_events";
import { setupExtensions } from "./media/media_extension_resolver";
import { setupServer } from "./remote/api/api_client";
import { setupStyles } from "./ui/style";
import { setupSwipeEvents } from "./communication/swipe_events";
import { setupTouchHoldEvents } from "./communication/touch_hold_events";

export function setupLibrary(): void {
  setupServer();
  setupDomEvents(ON_FAVORITES_PAGE ? Root : document.documentElement);
  setupTouchHoldEvents();
  setupSwipeEvents();
  setupExtensions();
  setupStyles();
  setupShell();
}
