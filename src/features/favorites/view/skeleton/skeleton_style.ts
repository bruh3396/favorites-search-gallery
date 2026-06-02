import { Layout } from "../../../../types/ui";

const skeletonStyles: Record<Layout, Record<string, string> | null> = {
  "tiler--column": { "width": "100%" },
  "tiler--grid": { "width": "100%" },
  "tiler--row": {},
  "tiler--square": { "width": "100%", "height": "100%", "aspect-ratio": "1/1" },
  "tiler--native": null
};

export function getSkeletonStyle(layout: Layout): Record<string, string> | null {
  return skeletonStyles[layout];
}
