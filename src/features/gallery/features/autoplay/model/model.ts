import * as AutoplayDurations from "@/features/gallery/features/autoplay/model/durations";
import * as AutoplayPlayback from "@/features/gallery/features/autoplay/model/playback";
import { AutoplayDuration } from "@/features/gallery/features/autoplay/types/types";
import { MediaItem } from "@/types/media";
import { NavigationKey } from "@/types/input";

export class AutoplayModel {
  public parseDuration(kind: AutoplayDuration, seconds: string, fallback: number): number {
    return AutoplayDurations.parse(kind, seconds, fallback);
  }

  public timerFor(item: MediaItem): AutoplayDuration {
    return AutoplayPlayback.timerFor(item);
  }

  public direction(forward: boolean): NavigationKey {
    return AutoplayPlayback.direction(forward);
  }

  public togglesPause(key: string, item: MediaItem | null): boolean {
    return AutoplayPlayback.togglesPause(key, item);
  }
}
