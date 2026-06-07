import { Root, setupShell } from "@/app/layout/shell";
import { Events } from "@/app/channels/events";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { setupDomEvents } from "@/app/dom/events";
import { setupExtensions } from "@/lib/media/media_extension_resolver";
import { setupServer } from "@/lib/remote/api/gateway";
import { setupStyles } from "@/lib/ui/style";
import { setupSwipeEvents } from "@/app/dom/swipe_events";
import { setupTouchHoldEvents } from "@/app/dom/touch_hold_events";

export function startRuntime(): void {
  setupServer();
  setupDomEvents(ON_FAVORITES_PAGE ? Root : document.documentElement);
  setupTouchHoldEvents();
  setupSwipeEvents();
  setupExtensions(Events.favorites.favoritesDatabaseLoaded.timeout(2_000));
  setupStyles(Preferences.appTheme.value);
  setupShell();
}
