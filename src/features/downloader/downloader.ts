import { DownloadRequest, createDownloadRequest } from "./download_request";
import { DownloadAbortedError } from "../../types/primitives/errors";
import { Favorite } from "../../types/interfaces/interfaces";
import { downloadBlob } from "../../lib/download/downloader";
import { runWithPools } from "../../utils/misc/async";

interface ZipWriter {
  add: (name: string, reader: unknown, options: { compression: string }) => Promise<void>;
  close: () => Promise<Blob>;
}

declare const zip: {
  BlobWriter: new (type: string) => unknown;
  BlobReader: new (blob: Blob) => unknown;
  ZipWriter: new (writer: unknown) => ZipWriter;
};

let aborted = false;
let currentlyDownloading = false;

export function setupFavoritesDownloader(): void {
  loadZipJS();
}

async function loadZipJS(): Promise<void> {
  await new Promise((resolve, reject) => {
    if (typeof zip !== "undefined") {
      resolve(zip);
      return;
    }
    const script = document.createElement("script");

    script.src = "https://cdn.jsdelivr.net/gh/gildas-lormeau/zip.js/dist/zip-full.min.js";
    script.onload = (): void => resolve(zip);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function startDownloading(favorites: Favorite[], progressCallback: (request: DownloadRequest) => void): Promise<void> {
  if (currentlyDownloading) {
    return;
  }
  currentlyDownloading = true;
  aborted = false;
  await downloadFavorites(favorites, progressCallback);
}

async function downloadFavorites(favorites: Favorite[], progressCallback: (request: DownloadRequest) => void): Promise<void> {
  downloadBlob(await createTotalFavoriteBlob(favorites, progressCallback), "download.zip");
  currentlyDownloading = false;
}

async function createTotalFavoriteBlob(favorites: Favorite[], progressCallback: (request: DownloadRequest) => void, poolSize: number = 15): Promise<Blob> {
  const blobWriter = new zip.BlobWriter("application/zip");
  const zipWriter = new zip.ZipWriter(blobWriter);

  await runWithPools(favorites, poolSize, async(favorite) => {
    await createFavoriteBlob(favorite, zipWriter, progressCallback);
  });
  stopIfAborted();
  return zipWriter.close();
}

async function createFavoriteBlob(favorite: Favorite, zipWriter: ZipWriter, progressCallback: (request: DownloadRequest) => void): Promise<void> {
  try {
    stopIfAborted();
    const request = await createDownloadRequest(favorite);

    stopIfAborted();
    const blob = await request.blob();

    stopIfAborted();
    await zipFile(zipWriter, request, blob);
    stopIfAborted();
    progressCallback?.(request);
    stopIfAborted();
  } catch (error) {
    stopIfAborted();
    console.error(error);
  }
}

async function zipFile(zipWriter: ZipWriter, request: DownloadRequest, blob: Blob): Promise<void> {
  const reader = new zip.BlobReader(blob);

  await zipWriter.add(request.filename, reader, {
    compression: "STORE"
  });
}

function stopIfAborted(): void {
  if (aborted) {
    throw new DownloadAbortedError();
  }
}

export function abort(): void {
  aborted = true;
}

export function reset(): void {
  currentlyDownloading = false;
}
