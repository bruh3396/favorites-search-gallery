import { AutoplayDuration } from "@/features/gallery/features/autoplay/types/types";
import { MediaItem } from "@/types/media";
import { NavigationKey } from "@/types/input";
import { isVideo } from "@/lib/media/media_type";

export function timerFor(item: MediaItem): AutoplayDuration {
  return isVideo(item) ? "minimumVideo" : "image";
}

export function direction(forward: boolean): NavigationKey {
  return forward ? "ArrowRight" : "ArrowLeft";
}

export function togglesPause(key: string, item: MediaItem | null): boolean {
  return key === "p" || (key === " " && item !== null && !isVideo(item));
}
