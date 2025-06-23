import { DownloadRequest, createDownloadRequest } from "./download_request";
import { DownloadAbortedError } from "../../types/primitives/errors";
import { Favorite } from "../../types/interfaces/interfaces";
import { downloadBlob } from "../../lib/download/downloader";
import { splitIntoChunks } from "../../utils/collection/array";

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
  const requests = await getDownloadRequests(favorites);

  checkIfAborted();
  const zippedBlob = await zipFiles(requests, progressCallback);

  checkIfAborted();
  downloadBlob(zippedBlob, "download.zip");
  currentlyDownloading = false;
}

async function zipFiles(requests: DownloadRequest[], progressCallback: (request: DownloadRequest) => void): Promise<Blob> {
  const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
  const chunks = splitIntoChunks(requests, 10);

  for (const chunk of chunks) {
    checkIfAborted();

    await Promise.all(chunk.map(async(request) => {
      checkIfAborted();

      try {
        const blob = await request.blob();

        checkIfAborted();
        await zipFile(zipWriter, request, blob);
        checkIfAborted();
      } catch (error) {
        console.error(error);
      }

      if (progressCallback) {
        progressCallback(request);
      }
    }));
  }
  checkIfAborted();
  return zipWriter.close();
}

async function zipFile(zipWriter: ZipWriter, request: DownloadRequest, blob: Blob): Promise<void> {
  const reader = new zip.BlobReader(blob);

  await zipWriter.add(request.filename, reader, {
    compression: "STORE"
  });
  checkIfAborted();
}

async function getDownloadRequests(favorites: Favorite[]): Promise<DownloadRequest[]> {
  const chunks = splitIntoChunks(favorites, 100);
  let result: DownloadRequest[] = [];

  for (const chunk of chunks) {
    checkIfAborted();

    const requests = await Promise.all(chunk.map((favorite) => {
      checkIfAborted();
      return createDownloadRequest(favorite);
    }));

    checkIfAborted();
    result = result.concat(requests);
  }
  return result;
}

function checkIfAborted(): void {
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
