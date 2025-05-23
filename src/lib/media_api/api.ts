export async function fetchImageBitmap(url: string): Promise<ImageBitmap> {
  const response = await fetch(url);
  const blob = await response.blob();
  return createImageBitmap(blob);
}
