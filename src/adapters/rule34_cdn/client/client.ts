import { Media, MediaKind } from "@/core/domain/media/media";
import { Rule34CdnImageDecoder, Rule34CdnImageDecoderDependencies } from "@/adapters/rule34_cdn/client/image_decoder";
import { fileUrl, previewUrl, wimgUrl } from "@/adapters/rule34_cdn/client/addresses";
import { mintMedia, readLocator } from "@/adapters/rule34_cdn/client/locator";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/extension_prober";
import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/extension";
import { Rule34CdnVideoDurationProber } from "@/adapters/rule34_cdn/client/video_duration_prober";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34CdnClientDependencies extends Rule34CdnImageDecoderDependencies {
  scheduler: Scheduler;
}

const KIND_EXTENSIONS: Record<MediaKind, Rule34CdnFileExtension | null> = { image: null, video: "mp4", gif: "gif" };

export class Rule34CdnClient {
  private readonly extensionProber: Rule34CdnExtensionProber;
  private readonly videoDurationProber: Rule34CdnVideoDurationProber;
  private readonly imageDecoder: Rule34CdnImageDecoder;

  constructor(private readonly dependencies: Rule34CdnClientDependencies) {
    this.extensionProber = new Rule34CdnExtensionProber(dependencies);
    this.videoDurationProber = new Rule34CdnVideoDurationProber(dependencies);
    this.imageDecoder = new Rule34CdnImageDecoder(dependencies);
  }

  public mintMedia(file: { url: string; tags: string }): Media | null {
    return mintMedia(file);
  }

  public previewUrl(media: Media): string {
    return previewUrl(media.locator);
  }

  public async originalUrl(media: Media): Promise<string> {
    return fileUrl(media.locator, await this.extension(media));
  }

  public stillUrl(media: Media): Promise<string> {
    return media.kind === "video" ? Promise.resolve(fileUrl(media.locator, "jpg")) : this.originalUrl(media);
  }

  public async decodeStill(media: Media, signal?: AbortSignal, width?: number): Promise<ImageBitmap> {
    const options: ImageBitmapOptions | undefined = width === undefined ? undefined : { resizeWidth: width, resizeQuality: "high" };
    return this.imageDecoder.decode(await this.stillUrl(media), signal, options);
  }

  public async loadOriginal(media: Media, signal?: AbortSignal): Promise<HTMLImageElement> {
    const image = await this.loadImageFromEitherHost(await this.originalUrl(media), signal);

    await image.decode();
    return image;
  }

  public async fetchOriginal(media: Media): Promise<Blob> {
    const url = await this.originalUrl(media);
    const response = await this.dependencies.fetch(url);

    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}`);
    }
    return response.blob();
  }

  public async probeDurationSeconds(media: Media): Promise<number> {
    return this.videoDurationProber.probeSeconds(await this.originalUrl(media));
  }

  private async loadImageFromEitherHost(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
    try {
      return await this.dependencies.loadImage(url, signal);
    } catch (error) {
      if (signal?.aborted === true) {
        throw error;
      }
      return this.dependencies.loadImage(wimgUrl(url), signal);
    }
  }

  private extension({ locator, kind }: Media): Promise<Rule34CdnFileExtension> {
    const known = readLocator(locator).extension ?? KIND_EXTENSIONS[kind];
    return Promise.resolve(known ?? this.extensionProber.probe(locator));
  }
}
