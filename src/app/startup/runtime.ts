import { Root, setupShell } from "@/app/layout/shell";
import { Events } from "@/app/channels/events";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { setupAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { setupDomEvents } from "@/app/dom/events";
import { setupExtensions } from "@/lib/media/resolver";
import { setupHotkeyEvents } from "@/app/dom/hotkey_events";
import { setupServer } from "@/lib/remote/api/ping";
import { setupStyles } from "@/app/startup/style";
import { setupSwipeEvents } from "@/app/dom/swipe_events";
import { setupTouchHoldEvents } from "@/app/dom/touch_hold_events";

export function setupRuntime(): void {
  setupServer();
  setupDomEvents(ON_FAVORITES_PAGE ? Root : document.documentElement);
  setupTouchHoldEvents();
  setupSwipeEvents();
  setupHotkeyEvents();
  setupAutocomplete();
  setupExtensions(Events.favorites.storedFavoritesLoaded.timeout(2_000));
  setupStyles();
  setupShell();
}
