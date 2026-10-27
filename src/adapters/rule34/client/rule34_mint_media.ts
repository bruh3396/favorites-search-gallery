import { Media } from "@/core/domain/media/media";

export type Rule34MintMedia = (file: { url: string; tags: string }) => Media | null;
