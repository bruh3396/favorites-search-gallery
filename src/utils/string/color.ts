export function brightWarmCoolHslColor(index: number, total: number): string {
  return warmCoolHslColor(index, total, 75, 70);
}

export function darkWarmCoolHslColor(index: number, total: number): string {
  return warmCoolHslColor(index, total, 75, 45);
}

export function warmCoolHslColor(index: number, total: number, saturation = 90, lightness = 70): string {
  const half = Math.max(total, 1) / 2;
  const fractionOfHalf = index / half;
  const inFirstHalf = index < half;
  const warmHue = Math.round(fractionOfHalf * 80);
  const coolHue = Math.round(200 + ((fractionOfHalf - 1) * 140));
  const hue = inFirstHalf ? warmHue : coolHue;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
