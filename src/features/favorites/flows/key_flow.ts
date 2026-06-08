import { EnhancedKeyboardEvent } from "@/types/input";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { inGallery } from "@/app/channels/feature_bridge";

const hotkeyHandlers: Record<string, () => void> = {
  "/": focusSearchBar
};

export function onKeyDown(event: EnhancedKeyboardEvent): void {
  if (!event.isHotkey || inGallery()) {
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
  document.getElementById(FavoritesId.searchBox)?.focus();
}
