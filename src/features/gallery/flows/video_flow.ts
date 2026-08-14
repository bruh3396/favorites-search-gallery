import { Preferences } from "@/app/context/preferences";

export function toggleVideoMute(): void {
  Preferences.gallery.videoMuted.set(!Preferences.gallery.videoMuted.value);
}

export function setVolume(volume: number): void {
  Preferences.gallery.videoVolume.set(volume);
}
