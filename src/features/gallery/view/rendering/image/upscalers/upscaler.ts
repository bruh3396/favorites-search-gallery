import { GalleryConfig } from "@/config/gallery_config";
import { GalleryMainThreadUpscaler } from "@/features/gallery/view/rendering/image/upscalers/main_thread_upscaler";
import { GalleryWorkerUpscalerWrapper } from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler_wrapper";
import { ImageRequest } from "@/features/gallery/types/image_request";

const upscaler = GalleryConfig.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper() : new GalleryMainThreadUpscaler();

export const upscaleOne = (request: ImageRequest): void => upscaler.upscale(request);
export const upscaleAll = (requests: ImageRequest[]): void => upscaler.upscaleAll(requests);
export const setCanvasDimensions = (thumbs: HTMLElement[]): void => upscaler.setCanvasDimensions(thumbs);
export const downscaleAll = (): void => upscaler.downscaleAll();
