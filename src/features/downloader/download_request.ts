import * as ExtensionResolver from "../../lib/media/media_extension_resolver";
import { Favorite } from "../../types/favorite";
import { resolveMediaURL } from "../../lib/server/url/media_url_resolver";

export class DownloadRequest {
  constructor(private readonly id: string, public url: string, public extension: string) {}

  public get filename(): string {
    return `${this.id}.${this.extension}`;
  }
}

export async function toDownloadRequest(favorite: Favorite): Promise<DownloadRequest> {
  const extension = await ExtensionResolver.resolveExtension(favorite);
  const url = await resolveMediaURL(favorite);
  return new DownloadRequest(favorite.id, url, extension);
}
