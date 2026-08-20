import { Dimensions2D } from "@/types/geometry";

export function toDimensions2D(dimensions: string): Dimensions2D {
  const match = dimensions.match(/^(\d+)(?:x|\/)(\d+)$/);
  return match ? { x: parseInt(match[1], 10), y: parseInt(match[2], 10)} : { x: 100, y: 100 };
}

export function rectDistance(rect1: DOMRectReadOnly, rect2: DOMRectReadOnly): number {
  const x1 = rect1.left + (rect1.width / 2);
  const y1 = rect1.top + (rect1.height / 2);
  const x2 = rect2.left + (rect2.width / 2);
  const y2 = rect2.top + (rect2.height / 2);
  return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
}
