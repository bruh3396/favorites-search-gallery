import { AutoplayConfig } from "@/config/autoplay_config";
import { AutoplayDuration } from "@/features/gallery/features/autoplay/types/types";
import { clamp } from "@/utils/pure/number";

export function parse(kind: AutoplayDuration, seconds: string, fallback: number): number {
  const value = parseFloat(seconds);
  const { min, max } = AutoplayConfig.durationSeconds[kind];
  return isNaN(value) ? fallback : Math.round(clamp(value * 1_000, min * 1_000, max * 1_000));
}
