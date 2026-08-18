import { FavoritesId } from "@/features/favorites/types/scaffold";
import { queueMacroTask } from "@/lib/async/scheduling";

const hotkeyHandlers: Record<string, () => void> = {
  "/": focusSearchBar
};

export function handleHotkey(key: string): void {
  const handler = hotkeyHandlers[key];

  if (handler === undefined) {
    return;
  }
  handler();
}

function focusSearchBar(): void {
  queueMacroTask(() => document.getElementById(FavoritesId.searchBox)?.focus());
}
