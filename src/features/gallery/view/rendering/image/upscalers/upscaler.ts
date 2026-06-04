import { GalleryConfig } from "@/config/gallery_config";
import { GalleryMainThreadUpscaler } from "@/features/gallery/view/rendering/image/upscalers/main_thread_upscaler";
import { GalleryWorkerUpscalerWrapper } from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler_wrapper";
import { ImageRequest } from "@/features/gallery/types/image_request";

const upscaler = GalleryConfig.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper() : new GalleryMainThreadUpscaler();

export const upscale = (request: ImageRequest): void => upscaler.upscale(request);
export const upscaleAnimated = (thumbs: HTMLElement[]): void => upscaler.upscaleAnimated(thumbs);
export const upscaleBatch = (requests: ImageRequest[]): Promise<void> => upscaler.upscaleBatch(requests);
export const setCanvasDimensions = (thumbs: HTMLElement[]): void => upscaler.setCanvasDimensions(thumbs);
export const reset = (): void => upscaler.reset();
