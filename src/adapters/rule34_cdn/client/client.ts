import { Media, MediaKind } from "@/core/domain/media/media";
import { Rule34CdnImageDecoder, Rule34CdnImageDecoderDependencies } from "@/adapters/rule34_cdn/client/image_decoder";
import { fileUrl, previewUrl } from "@/adapters/rule34_cdn/client/addresses";
import { mintMedia, readLocator } from "@/adapters/rule34_cdn/client/locator";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/extension_prober";
import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/extension";
import { Rule34CdnVideoDurationReader } from "@/adapters/rule34_cdn/client/video_duration";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34CdnClientDependencies extends Rule34CdnImageDecoderDependencies {
  scheduler: Scheduler;
}

const KIND_EXTENSIONS: Record<MediaKind, Rule34CdnFileExtension | null> = { image: null, video: "mp4", gif: "gif" };

export class Rule34CdnClient {
  private readonly extensionProber: Rule34CdnExtensionProber;
  private readonly videoDurationReader: Rule34CdnVideoDurationReader;
  private readonly imageDecoder: Rule34CdnImageDecoder;

  constructor(dependencies: Rule34CdnClientDependencies) {
    this.extensionProber = new Rule34CdnExtensionProber(dependencies);
    this.videoDurationReader = new Rule34CdnVideoDurationReader(dependencies);
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

  public imageUrl(media: Media): Promise<string> {
    return media.kind === "video" ? Promise.resolve(fileUrl(media.locator, "jpg")) : this.originalUrl(media);
  }

  public async decodeImage(media: Media, signal?: AbortSignal): Promise<ImageBitmap> {
    return this.imageDecoder.decode(await this.imageUrl(media), signal);
  }

  public async decodeOriginal(media: Media, signal?: AbortSignal): Promise<ImageBitmap> {
    return this.imageDecoder.decode(await this.originalUrl(media), signal);
  }

  public async readVideoDurationSeconds(media: Media): Promise<number> {
    return this.videoDurationReader.readSeconds(await this.originalUrl(media));
  }

  private extension({ locator, kind }: Media): Promise<Rule34CdnFileExtension> {
    const known = readLocator(locator).extension ?? KIND_EXTENSIONS[kind];
    return Promise.resolve(known ?? this.extensionProber.probe(locator));
  }
}
