export function createObjectUrlFromSvg(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}
