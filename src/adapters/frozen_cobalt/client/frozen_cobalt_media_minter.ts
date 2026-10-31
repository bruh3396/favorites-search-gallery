import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { Media } from "@/core/domain/media/media";

export type FrozenCobaltMediaMinter = (file: Pick<FrozenCobaltPost, "directory" | "stem" | "extension"> & { tags: string }) => Media;
