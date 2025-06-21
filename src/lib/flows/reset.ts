import { Events } from "../global/events/events";
import { ON_MOBILE_DEVICE } from "../global/flags/intrinsic_flags";

const PERSISTENT_LOCAL_STORAGE_KEYS = new Set(["customTags", "savedSearches"]);
const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag modifications and saved searches will be preserved.";
const RESET_PROMPT = `Are you sure you want to reset? This will delete all cached favorites, and preferences.${ON_MOBILE_DEVICE ? "" : DESKTOP_RESET_PROMPT_SUFFIX}`;

function clearLocalStorage(): void {
  Object.keys(localStorage).forEach((key) => {
    if (!PERSISTENT_LOCAL_STORAGE_KEYS.has(key)) {
      localStorage.removeItem(key);
    }
  });
}

export function tryResetting(): void {
  if (confirm(RESET_PROMPT)) {
    clearLocalStorage();
    Events.favorites.reset.emit();
  }
}
