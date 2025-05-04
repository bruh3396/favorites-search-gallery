import { Events } from "./events";
import { GeneralSettings } from "../../config/general_settings";
import { ON_FAVORITES_PAGE } from "./flags";
import { ThrottledQueue } from "../../components/functional/throttled_queue";

export const POST_PAGE = new ThrottledQueue(ON_FAVORITES_PAGE ? GeneralSettings.postPageRequestDelayWhileFetchingFavorites : GeneralSettings.searchPagePostPageRequestDelay);
export const POST_METADATA = new ThrottledQueue(GeneralSettings.throttledMetadataAPIRequestDelay);
export const BRUTE_FORCE_EXTENSION = new ThrottledQueue(GeneralSettings.bruteForceImageExtensionRequestDelay);
export const IMAGE_REQUEST = new ThrottledQueue(GeneralSettings.imageRequestDelay);

export function setupGlobalQueues(): void {
  if (ON_FAVORITES_PAGE) {
    Events.favorites.favoritesLoaded.on(() => {
      POST_PAGE.setDelay(GeneralSettings.postPageRequestDelayAfterFavoritesLoaded);
    }, {
      once: true
    });
  }
}
