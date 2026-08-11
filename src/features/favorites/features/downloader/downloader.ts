import { DownloaderContext } from "@/features/favorites/features/downloader/types";
import { setContext } from "@/features/favorites/features/downloader/deps";

export { mount, refreshCount, unlock } from "@/features/favorites/features/downloader/panel";

export function setup(context: DownloaderContext): void {
  setContext(context);
}
