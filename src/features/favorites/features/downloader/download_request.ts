import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { MediaItem } from "@/types/media";
import { resolveMediaUrl } from "@/lib/media/url_resolver";

export class DownloadRequest {
  constructor(private readonly id: string, public url: string, public extension: string) {}

  public get filename(): string {
    return `${this.id}.${this.extension}`;
  }
}

export async function toDownloadRequest(item: MediaItem): Promise<DownloadRequest> {
  const extension = await ExtensionResolver.resolveExtension(item);
  const url = await resolveMediaUrl(item);
  return new DownloadRequest(item.id, url, extension);
}
