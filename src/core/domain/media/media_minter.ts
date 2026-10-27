import { Media } from "@/core/domain/media/media";

export type MediaMinter = (file: { url: string; tags: string }) => Media | null;
