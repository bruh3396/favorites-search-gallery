import * as ExtensionCache from "../../lib/media/extension_cache";
import { isGif, isVideo } from "../../lib/media/media_resolver";
import { Favorite } from "../../types/favorite";
import { resolveMediaURL } from "../../lib/server/url/media_url_resolver";

export class DownloadRequest {
  public id: string;
  public url: string;
  public extension: string;

  constructor(id: string, url: string, extension: string) {
    this.id = id;
    this.url = url;
    this.extension = extension;
  }

  public get filename(): string {
    return `${this.id}.${this.extension}`;
  }
}

export async function createDownloadRequest(favorite: Favorite): Promise<DownloadRequest> {
  let extension;

  if (isVideo(favorite)) {
    extension = "mp4";
  } else if (isGif(favorite)) {
    extension = "gif";
  } else {
    extension = await ExtensionCache.getExtension(favorite);
  }
  const url = await resolveMediaURL(favorite);
  return new DownloadRequest(favorite.id, url, extension);
}
