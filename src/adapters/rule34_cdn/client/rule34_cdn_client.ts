import { Rule34CdnFileExtension, isRule34CdnFileExtension } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";
import { Rule34CdnImageDecoder, Rule34CdnImageDecoderDependencies } from "@/adapters/rule34_cdn/client/rule34_cdn_image_decoder";
import { buildRule34CdnFileUrl, buildRule34CdnPreviewUrl, buildRule34CdnWimgUrl } from "@/adapters/rule34_cdn/client/rule34_cdn_url_builder";
import { Media } from "@/core/domain/media/media";
import { MediaKind } from "@/core/domain/media/media_kind";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/rule34_cdn_extension_prober";
import { Rule34CdnVideoDurationProber } from "@/adapters/rule34_cdn/client/rule34_cdn_video_duration_prober";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { mintRule34CdnMedia } from "@/adapters/rule34_cdn/client/rule34_cdn_media_minter";
import { parseRule34CdnFileUrl } from "@/adapters/rule34_cdn/client/rule34_cdn_file_url_parser";
import { readRule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";

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
    const { fetch, scheduler, loadImage, decodeBitmap } = dependencies;

    this.extensionProber = new Rule34CdnExtensionProber({ fetch, scheduler });
    this.videoDurationProber = new Rule34CdnVideoDurationProber({ fetch, scheduler });
    this.imageDecoder = new Rule34CdnImageDecoder({ fetch, loadImage, decodeBitmap });
  }

  public mintMediaFromUrl({ url, tags }: { url: string; tags: string }): Media | null {
    const rule34CdnLocator = parseRule34CdnFileUrl(url);
    return rule34CdnLocator === null ? null : mintRule34CdnMedia({ rule34CdnLocator, tags });
  }

  public mintMediaFromParts({ directory, stem, extension, tags }: { directory: number; stem: string; extension: string; tags: string }): Media {
    const rule34CdnLocator = { directory: String(directory), stem, extension: isRule34CdnFileExtension(extension) ? extension : null };
    return mintRule34CdnMedia({ rule34CdnLocator, tags });
  }

  // Correcting the tag guess is off for now: the probe turned post list videos into their jpg stills
  public resolveMedia(media: Media): Promise<Media> {
    return Promise.resolve(media);
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
