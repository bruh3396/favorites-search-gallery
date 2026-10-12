import { wimgUrl } from "@/adapters/rule34_cdn/client/addresses";

export interface Rule34CdnImageDecoderDependencies {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  loadImage: (url: string, signal?: AbortSignal) => Promise<HTMLImageElement>;
  decodeBitmap: (source: ImageBitmapSource) => Promise<ImageBitmap>;
}

/** Some files the bare host won't serve to a fetch still load from WIMG through an image element. */
export class Rule34CdnImageDecoder {
  private readonly elementOnlyUrls = new Set<string>();

  constructor(private readonly dependencies: Rule34CdnImageDecoderDependencies) { }

  public async decode(url: string, signal?: AbortSignal): Promise<ImageBitmap> {
    return this.dependencies.decodeBitmap(await this.load(url, signal));
  }

  private async load(url: string, signal?: AbortSignal): Promise<ImageBitmapSource> {
    if (!this.elementOnlyUrls.has(url)) {
      try {
        return await this.fetchBlob(url, signal);
      } catch (error) {
        if (signal?.aborted === true) {
          throw error;
        }
      }
    }
    const image = await this.dependencies.loadImage(wimgUrl(url), signal);

    this.elementOnlyUrls.add(url);
    return image;
  }

  private async fetchBlob(url: string, signal?: AbortSignal): Promise<Blob> {
    const response = await this.dependencies.fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}`);
    }
    return response.blob();
  }
}
