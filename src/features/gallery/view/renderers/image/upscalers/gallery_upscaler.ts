import { GalleryMainThreadUpscaler } from "./gallery_main_thread_upscaler";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { GalleryWorkerUpscalerWrapper } from "./gallery_worker_upscaler_wrapper";
import { ImageRequest } from "../../../../type/gallery_image_request";

const upscaler = GallerySettings.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper() : new GalleryMainThreadUpscaler();

export const upscale = (request: ImageRequest): void => upscaler.upscale(request);
export const upscaleAnimated = (thumbs: HTMLElement[]): void => upscaler.upscaleAnimated(thumbs);
export const upscaleBatch = (requests: ImageRequest[]): Promise<void> => upscaler.upscaleBatch(requests);
export const presetCanvasDimensions = (thumbs: HTMLElement[]): void => upscaler.presetCanvasDimensions(thumbs);
export const handlePageChange = (): void => upscaler.handlePageChange();
