import { buildRule34CdnWimgUrl } from "@/adapters/rule34_cdn/client/rule34_cdn_url_builder";

export interface Rule34CdnImageDecoderDependencies {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  loadImage: (url: string, signal?: AbortSignal) => Promise<HTMLImageElement>;
  decodeBitmap: (source: ImageBitmapSource, options?: ImageBitmapOptions) => Promise<ImageBitmap>;
}

export class Rule34CdnImageDecoder {
  private readonly elementOnlyUrls = new Set<string>();

  constructor(private readonly dependencies: Rule34CdnImageDecoderDependencies) { }

  public async decode(url: string, signal?: AbortSignal, options?: ImageBitmapOptions): Promise<ImageBitmap> {
    return this.dependencies.decodeBitmap(await this.load(url, signal), options);
  }

  private load(url: string, signal?: AbortSignal): Promise<ImageBitmapSource> {
    if (this.elementOnlyUrls.has(url)) {
      return this.loadElement(url, signal);
    }
    return this.loadBlob(url, signal);
  }

  private async loadBlob(url: string, signal?: AbortSignal): Promise<ImageBitmapSource> {
    try {
      return await this.fetchBlob(url, signal);
    } catch (error) {
      if (signal?.aborted === true) {
        throw error;
      }
      return this.loadElement(url, signal);
    }
  }

  private async loadElement(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
    const image = await this.dependencies.loadImage(buildRule34CdnWimgUrl(url), signal);

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
