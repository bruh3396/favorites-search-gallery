import { ON_FAVORITES_PAGE, PLATFORM, USER_ID, VERSION } from "@/app/context/environment";
import { Root, setupShell } from "@/app/layout/shell";
import { setupAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { setupDomEvents } from "@/app/dom/events";
import { setupHotkeyEvents } from "@/app/dom/hotkey_events";
import { ping as setupServer } from "@/lib/remote/fetchers/api";
import { setupStyles } from "@/app/startup/style";
import { setupSwipeEvents } from "@/app/dom/swipe_events";
import { setupTouchHoldEvents } from "@/app/dom/touch_hold_events";

export function setupRuntime(): void {
  setupServer({ userId: USER_ID, version: VERSION, platform: PLATFORM });
  setupDomEvents(ON_FAVORITES_PAGE ? Root : document.documentElement);
  setupTouchHoldEvents();
  setupSwipeEvents();
  setupHotkeyEvents();
  setupAutocomplete(ON_FAVORITES_PAGE);
  setupStyles();
  setupShell();
}
