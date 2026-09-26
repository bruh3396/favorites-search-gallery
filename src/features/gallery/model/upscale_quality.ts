import { QualityCutoff } from "@/types/app";

export function qualityFor(thumbWidth: number, viewportWidth: number, cutoffs: QualityCutoff[]): number | null {
  if (thumbWidth <= 0 || viewportWidth <= 0) {
    return null;
  }
  const ratio = thumbWidth / viewportWidth;
  const cutoff = cutoffs.find(({ maxRatio }) => ratio < maxRatio);
  return cutoff?.quality ?? 1;
}
