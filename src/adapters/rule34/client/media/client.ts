import { Media, MediaKind } from "@/core/domain/media/media";
import { fileUrl, previewUrl } from "@/adapters/rule34/client/media/addresses";
import { mintMedia, readLocator } from "@/adapters/rule34/client/media/locator";
import { ExtensionProber } from "@/adapters/rule34/client/media/extension_prober";
import { FileExtension } from "@/adapters/rule34/client/media/extension";
import { VideoDurationReader } from "@/adapters/rule34/client/media/video_duration";

const KIND_EXTENSIONS: Record<MediaKind, FileExtension | null> = { image: null, video: "mp4", gif: "gif" };

export class Rule34MediaClient {
  private readonly extensionProber = new ExtensionProber();
  private readonly videoDurationReader = new VideoDurationReader();

  public mintMedia(url: string, tags: string): Media | null {
    return mintMedia(url, tags);
  }

  public previewUrl(locator: string): string {
    return previewUrl(locator);
  }

  public async originalUrl(locator: string, kind: MediaKind): Promise<string> {
    return fileUrl(locator, await this.extension(locator, kind));
  }

  public imageUrl(locator: string, kind: MediaKind): Promise<string> {
    return kind === "video" ? Promise.resolve(fileUrl(locator, "jpg")) : this.originalUrl(locator, kind);
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

  private extension(locator: string, kind: MediaKind): Promise<FileExtension> {
    return Promise.resolve(readLocator(locator).extension ?? KIND_EXTENSIONS[kind] ?? this.extensionProber.probe(locator));
  }
}
