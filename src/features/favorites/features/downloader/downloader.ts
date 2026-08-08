import { DownloaderCallbacks } from "@/features/favorites/features/downloader/types";
import { Preferences } from "@/app/context/preferences";
import { refreshCount } from "@/features/favorites/features/downloader/ui";
import { setDeps } from "@/features/favorites/features/downloader/deps";

export { buildDrawerView, refreshCount, unlock } from "@/features/favorites/features/downloader/ui";

export function setup(callbacks: DownloaderCallbacks): void {
  setDeps(callbacks);
  Preferences.favorites.downloadBatchSize.on(refreshCount);
  Preferences.favorites.downloadFilenameFormat.on(refreshCount);
}
