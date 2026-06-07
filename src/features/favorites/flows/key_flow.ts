import { EnhancedKeyboardEvent } from "@/types/input";
import { FavoritesMenuId } from "@/features/favorites/types/scaffold";
import { FeatureBridge } from "@/app/channels/feature_bridge";

const hotkeyHandlers: Record<string, () => void> = {
  "/": focusSearchBar
};

export function onKeyDown(event: EnhancedKeyboardEvent): void {
  if (!event.isHotkey || FeatureBridge.inGallery.call()) {
    return;
  }
  const handler = hotkeyHandlers[event.key.toLowerCase()];

  if (handler === undefined) {
    return;
  }
  event.originalEvent.preventDefault();
  handler();
}

function focusSearchBar(): void {
  document.getElementById(FavoritesMenuId.searchBox)?.focus();
}
