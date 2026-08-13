import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { setDependencies } from "@/features/favorites/features/downloader/deps";

export { mount, reRender, enable } from "@/features/favorites/features/downloader/panel";

export function setup(deps: DownloaderDependencies): void {
  setDependencies(deps);
}
