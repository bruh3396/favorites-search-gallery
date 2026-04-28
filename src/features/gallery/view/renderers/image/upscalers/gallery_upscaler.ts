import { GalleryMainThreadUpscaler } from "./gallery_main_thread__upscaler";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { GalleryWorkerUpscalerWrapper } from "./gallery_worker_upscaler_wrapper";
import { ImageRequest } from "../../../../types/gallery_image_request";

const UPSCALER = GallerySettings.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper() : new GalleryMainThreadUpscaler();

export const upscale = (request: ImageRequest): void => UPSCALER.upscale(request);
export const upscaleAnimated = (thumbs: HTMLElement[]): void => UPSCALER.upscaleAnimated(thumbs);
export const upscaleBatch = (requests: ImageRequest[]): Promise<void> => UPSCALER.upscaleBatch(requests);
export const presetCanvasDimensions = (thumbs: HTMLElement[]): void => UPSCALER.presetCanvasDimensions(thumbs);
export const handlePageChange = (): void => UPSCALER.handlePageChange();
