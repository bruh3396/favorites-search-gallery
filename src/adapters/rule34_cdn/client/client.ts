import { Media, MediaKind } from "@/core/domain/media/media";
import { Rule34CdnImageDecoder, Rule34CdnImageDecoderDependencies } from "@/adapters/rule34_cdn/client/image_decoder";
import { fileUrl, previewUrl } from "@/adapters/rule34_cdn/client/addresses";
import { mintMedia, readLocator } from "@/adapters/rule34_cdn/client/locator";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/extension_prober";
import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/extension";
import { Rule34CdnVideoDurationReader } from "@/adapters/rule34_cdn/client/video_duration";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34CdnClientDependencies extends Rule34CdnImageDecoderDependencies {
  scheduler: Scheduler;
}

const KIND_EXTENSIONS: Record<MediaKind, Rule34CdnFileExtension | null> = { image: null, video: "mp4", gif: "gif" };
const IMAGE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 20 };

export class Rule34CdnClient {
  private readonly extensionProber: Rule34CdnExtensionProber;
  private readonly videoDurationReader: Rule34CdnVideoDurationReader;
  private readonly imageDecoder: Rule34CdnImageDecoder;
  private readonly imageLimiter: RateLimiter;

  constructor(private readonly dependencies: Rule34CdnClientDependencies) {
    this.extensionProber = new Rule34CdnExtensionProber(dependencies);
    this.videoDurationReader = new Rule34CdnVideoDurationReader(dependencies);
    this.imageDecoder = new Rule34CdnImageDecoder(dependencies);
    this.imageLimiter = new RateLimiter(IMAGE_RATE_LIMIT, dependencies.scheduler);
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

  public imageUrl(media: Media): Promise<string> {
    return media.kind === "video" ? Promise.resolve(fileUrl(media.locator, "jpg")) : this.originalUrl(media);
  }

  public async decodeImage(media: Media, width: number, signal?: AbortSignal): Promise<ImageBitmap> {
    const url = await this.imageUrl(media);
    return this.imageLimiter.run(() => this.imageDecoder.decode(url, signal, { resizeWidth: width, resizeQuality: "high" }), signal);
  }

  public async decodeOriginal(media: Media, signal?: AbortSignal): Promise<ImageBitmap> {
    return this.imageDecoder.decode(await this.originalUrl(media), signal);
  }

  public async fetchOriginal(media: Media): Promise<Blob> {
    const url = await this.originalUrl(media);
    const response = await this.dependencies.fetch(url);

    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}`);
    }
    return response.blob();
  }

  public async readVideoDurationSeconds(media: Media): Promise<number> {
    return this.videoDurationReader.readSeconds(await this.originalUrl(media));
  }

  private extension({ locator, kind }: Media): Promise<Rule34CdnFileExtension> {
    const known = readLocator(locator).extension ?? KIND_EXTENSIONS[kind];
    return Promise.resolve(known ?? this.extensionProber.probe(locator));
  }
}
