import { getExtensionFromURL } from "../../store/indexed_db/extensions";
import { getOriginalContentURL } from "../media_api/api";

function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function download(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();

  downloadBlob(blob, filename);
}

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const originalContentURL = await getOriginalContentURL(thumb);
  const extension = getExtensionFromURL(originalContentURL) ?? "jpg";
  const filename = `${thumb.id}.${extension}`;

  download(originalContentURL, filename);
}
