class Downloader {
  static {
    Utils.addStaticInitializer(Downloader.loadZipJS);
  }

  static loadZipJS() {
    return new Promise((resolve, reject) => {
      if (typeof zip !== "undefined") {
        resolve(zip);
        return;
      }
      const script = document.createElement("script");

      script.src = "https://cdn.jsdelivr.net/gh/gildas-lormeau/zip.js/dist/zip-full.min.js";
      script.onload = () => resolve(zip);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * @param {Post[]} posts
   * @param {{onFetch?: Function, onFetchEnd?: Function, onZipEnd?:Function}} callbacks
   */
  static async downloadPosts(posts, callbacks) {
    const requests = await Downloader.getDownloadRequests(posts);
    const zippedBlob = await Downloader.zipFiles(requests, callbacks.onFetch);

    if (callbacks.onFetchEnd) {
      callbacks.onFetchEnd();
    }
    this.downloadBlob(zippedBlob);
  }

  /**
   * @param {DownloadRequest[]} requests
   * @param {Function | undefined} onFetch
   * @returns {Promise<Blob>}
   */
  static async zipFiles(requests, onFetch) {
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
    const chunks = Utils.splitIntoChunks(requests, 10);

    for (const chunk of chunks) {
      await Promise.all(chunk.map(async(request) => {
        const blob = await request.blob();

        await Downloader.zipFile(zipWriter, request, blob);

        if (onFetch) {
          onFetch();
        }
      }));
    }
    return zipWriter.close();
  }

  /**
   * @param {any} zipWriter
   * @param {DownloadRequest} request
   * @param {Blob} blob
   */
  static async zipFile(zipWriter, request, blob) {
    const reader = new zip.BlobReader(blob);

    await zipWriter.add(request.filename, reader, {
      compression: "STORE"
    });
  }

  /**
   * @param {Post[]} posts
   * @returns {Promise<DownloadRequest[]>}
   */
  static async getDownloadRequests(posts) {
    const chunks = Utils.splitIntoChunks(posts, 100);
    /**
     * @type {DownloadRequest[]}
     */
    let result = [];

    for (const chunk of chunks) {
      const requests = await Promise.all(chunk.map(async(post) => {
        const {url, extension} = await post.getOriginalFileURL();
        return new DownloadRequest(post.id, url, extension);
      }));

      result = result.concat(requests);
    }
    return result;
  }

  /**
   * @param {Blob} blob
   * @param {String} filename
   */
  static downloadBlob(blob, filename = "download.zip") {
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
}
