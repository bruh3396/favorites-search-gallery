import { NavigationKey } from "@/types/input";
import { Platform } from "@/types/app";
import { Preference } from "@/lib/storage/preference";

export type AutoplayDuration = "image" | "minimumVideo";

export type AutoplayAction = "toggleSettings" | "togglePause" | "toggleDirection";

export interface AutoplayCallbacks {
  navigate: (direction: NavigationKey) => void;
  restartVideo: () => void;
  setVideoLooping: (looping: boolean) => void;
}

export interface AutoplaySettings {
  active: Preference<boolean>;
  paused: Preference<boolean>;
  forward: Preference<boolean>;
  durations: Record<AutoplayDuration, Preference<number>>;
}

export interface AutoplayDependencies extends AutoplayCallbacks, AutoplaySettings {
  platform: Platform;
}

export interface AutoplayIntents {
  toggleSettings: () => void;
  togglePause: () => void;
  toggleDirection: () => void;
  holdMenu: (held: boolean) => void;
  changeDuration: (kind: AutoplayDuration, seconds: string) => void;
}

export interface AutoplayScene {
  paused: boolean;
  forward: boolean;
  durations: Record<AutoplayDuration, number>;
}
