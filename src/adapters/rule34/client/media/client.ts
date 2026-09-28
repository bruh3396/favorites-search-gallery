import * as Addresses from "@/adapters/rule34/client/media/addresses";
import { ExtensionProber } from "@/adapters/rule34/client/media/extension_prober";
import { FileExtension } from "@/adapters/rule34/client/media/extension";
import { MediaKind } from "@/core/domain/media/media";
import { VideoDurationReader } from "@/adapters/rule34/client/media/video_duration";
import { readLocator } from "@/adapters/rule34/client/media/locator";

const KIND_EXTENSIONS: Record<MediaKind, FileExtension | null> = { image: null, video: "mp4", gif: "gif" };

export class Rule34MediaClient {
  private readonly extensionProber = new ExtensionProber();
  private readonly videoDurationReader = new VideoDurationReader();

  public previewUrl(locator: string): string {
    return Addresses.previewUrl(locator);
  }

  public async originalUrl(locator: string, kind: MediaKind): Promise<string> {
    const extension = readLocator(locator).extension ?? KIND_EXTENSIONS[kind] ?? await this.extensionProber.probe(locator);
    return Addresses.fileUrl(locator, extension);
  }

  public async fetchFile(url: string, signal?: AbortSignal): Promise<Blob> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    return response.blob();
  }

  public readVideoDuration(url: string): Promise<number> {
    return this.videoDurationReader.read(url);
  }
}
