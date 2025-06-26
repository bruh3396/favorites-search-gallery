import { isGif, isVideo } from "../../utils/content/content_type";
import { Favorite } from "../../types/interfaces/interfaces";
import { getExtension } from "../../lib/global/extensions";
import { getOriginalContentURL } from "../../lib/api/media_api";

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

  public async blob(): Promise<Blob> {
    const response = await fetch(this.url);
    return response.blob();
  }
}

export async function createDownloadRequest(favorite: Favorite): Promise<DownloadRequest> {
  let extension;

  if (isVideo(favorite)) {
    extension = "mp4";
  } else if (isGif(favorite)) {
    extension = "gif";
  } else {
    extension = await getExtension(favorite);
  }
  const url = await getOriginalContentURL(favorite);
  return new DownloadRequest(favorite.id, url, extension);
}
