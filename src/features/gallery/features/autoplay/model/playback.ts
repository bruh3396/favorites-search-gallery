import { AutoplayDuration } from "@/features/gallery/features/autoplay/types/types";
import { NavigationKey } from "@/types/input";
import { PostMedia } from "@/core/domain/post/post";
import { isVideo } from "@/lib/media/media_type";

export function timerFor(item: PostMedia): AutoplayDuration {
  return isVideo(item) ? "minimumVideo" : "image";
}

export function direction(forward: boolean): NavigationKey {
  return forward ? "ArrowRight" : "ArrowLeft";
}

export function togglesPause(key: string, item: PostMedia | null): boolean {
  return key === "p" || (key === " " && item !== null && !isVideo(item));
}
