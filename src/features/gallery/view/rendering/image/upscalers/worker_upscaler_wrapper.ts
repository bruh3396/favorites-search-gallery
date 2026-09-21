import { Environment } from "@/app/context/environment";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import OFFSCREEN_UPSCALER_CODE from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler?raw";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { replaceCanvas } from "@/utils/browser/canvas";
import { resolveImageUrl } from "@/lib/media/resolver";
import { toMediaItem } from "@/lib/ui/thumb/media_item";

export class GalleryWorkerUpscalerWrapper extends GalleryAbstractUpscaler {
  protected readonly needsBitmapForPaint: boolean = false;
  private readonly worker: Worker;
  private readonly transferredCanvases: Map<string, HTMLCanvasElement> = new Map();

  constructor(environment: Environment, preferences: Preferences, shell: Shell) {
    super(environment, preferences, shell);
    this.worker = new Worker(URL.createObjectURL(new Blob([OFFSCREEN_UPSCALER_CODE], { type: "application/javascript" })));
    this.worker.postMessage({
      action: "init",
      config: {
        upscaledCanvasWidth: this.upscaledCanvasWidth,
        maxUpscaledCanvasHeight: GalleryUpscaleConfig.maxUpscaledCanvasHeight
      }
    });
  }

  protected evict(id: string): void {
    const transferred = this.transferredCanvases.get(id);

    if (transferred !== undefined) {
      replaceCanvas(transferred);
      this.transferredCanvases.delete(id);
    }
    this.worker.postMessage({ action: "evict", id });
  }

  protected async paint(request: ImageRequest): Promise<void> {
    const url = await resolveImageUrl(toMediaItem(request.thumb));
    const canvas = this.transferCanvas(request);

    if (canvas === undefined) {
      this.worker.postMessage({ action: "paint", id: request.id, url });
    } else {
      this.worker.postMessage({ action: "paint", id: request.id, url, canvas }, [canvas]);
    }
  }

  private transferCanvas(request: ImageRequest): OffscreenCanvas | undefined {
    if (this.transferredCanvases.has(request.id)) {
      return undefined;
    }
    const canvas = request.thumb.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
      return undefined;
    }
    this.transferredCanvases.set(request.id, canvas);
    return canvas.transferControlToOffscreen();
  }
}
