import { GalleryConfig } from "../../../../../../config/gallery_config";
import { GalleryMainThreadUpscaler } from "./main_thread_upscaler";
import { GalleryWorkerUpscalerWrapper } from "./worker_upscaler_wrapper";
import { ImageRequest } from "../../../../types/image_request";

const upscaler = GalleryConfig.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper() : new GalleryMainThreadUpscaler();

export const upscale = (request: ImageRequest): void => upscaler.upscale(request);
export const upscaleAnimated = (thumbs: HTMLElement[]): void => upscaler.upscaleAnimated(thumbs);
export const upscaleBatch = (requests: ImageRequest[]): Promise<void> => upscaler.upscaleBatch(requests);
export const setCanvasDimensions = (thumbs: HTMLElement[]): void => upscaler.setCanvasDimensions(thumbs);
export const reset = (): void => upscaler.reset();
