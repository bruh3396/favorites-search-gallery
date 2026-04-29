export function getRectDistance(rect1: DOMRectReadOnly, rect2: DOMRectReadOnly): number {
  const x1 = rect1.left + (rect1.width / 2);
  const y1 = rect1.top + (rect1.height / 2);
  const x2 = rect2.left + (rect2.width / 2);
  const y2 = rect2.top + (rect2.height / 2);
  return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
}
