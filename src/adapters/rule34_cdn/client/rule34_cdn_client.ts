import { Media } from "@/core/domain/media/media";
import { MediaKind } from "@/core/domain/media/media_kind";
import { Rule34CdnFileExtension, rule34CdnFileExtensionKind } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";
import { Rule34CdnImageDecoder, Rule34CdnImageDecoderDependencies } from "@/adapters/rule34_cdn/client/rule34_cdn_image_decoder";
import { buildRule34CdnFileUrl, buildRule34CdnPreviewUrl, buildRule34CdnWimgUrl } from "@/adapters/rule34_cdn/client/rule34_cdn_url_builder";
import { mintRule34CdnMedia } from "@/adapters/rule34_cdn/client/rule34_cdn_media_minter";
import { readRule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/rule34_cdn_extension_prober";
import { Rule34CdnVideoDurationProber } from "@/adapters/rule34_cdn/client/rule34_cdn_video_duration_prober";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34CdnClientDependencies extends Rule34CdnImageDecoderDependencies {
  scheduler: Scheduler;
}

const KIND_EXTENSIONS: Record<MediaKind, Rule34CdnFileExtension | null> = { image: null, video: "mp4", gif: "gif" };
const FALLBACK_EXTENSION: Rule34CdnFileExtension = "jpg";

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
    return mintRule34CdnMedia(file);
  }

  public async resolveMedia(media: Media): Promise<Media> {
    if (readRule34CdnLocator(media.locator).extension !== null) {
      return media;
    }
    const extension = await this.extensionProber.probe(media.locator, media.kind);
    return extension === null ? media : { kind: rule34CdnFileExtensionKind(extension), locator: `${media.locator}.${extension}` };
  }

  public previewUrl(media: Media): string {
    return buildRule34CdnPreviewUrl(media.locator);
  }

  public async originalUrl(media: Media): Promise<string> {
    return buildRule34CdnFileUrl(media.locator, await this.extension(media));
  }

  public stillUrl(media: Media): Promise<string> {
    return media.kind === "video" ? Promise.resolve(buildRule34CdnFileUrl(media.locator, "jpg")) : this.originalUrl(media);
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
      return this.dependencies.loadImage(buildRule34CdnWimgUrl(url), signal);
    }
  }

  private async extension({ locator, kind }: Media): Promise<Rule34CdnFileExtension> {
    const known = readRule34CdnLocator(locator).extension ?? KIND_EXTENSIONS[kind];
    return known ?? await this.extensionProber.probe(locator, kind) ?? FALLBACK_EXTENSION;
  }
}
