import {Events} from "../functional/events";
import {ON_MOBILE_DEVICE} from "../functional/flags";

function askToReset(): boolean {
  const desktopSuffix = ON_MOBILE_DEVICE ? "" : " Tag modifications and saved searches will be preserved.";
  const message = `Are you sure you want to reset? This will delete all cached favorites, and preferences.${desktopSuffix}`;
  return confirm(message);
}

function clearLocalStorage(): void {
  const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

  Object.keys(localStorage).forEach((key) => {
    if (!persistentLocalStorageKeys.has(key)) {
      localStorage.removeItem(key);
    }
  });
}

export function tryResetting(): void {
  if (askToReset()) {
    clearLocalStorage();
    Events.favorites.reset.emit();
  }
}
