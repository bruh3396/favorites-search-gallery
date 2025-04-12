class FavoritesDownloader {
  static {
    Utils.addStaticInitializer(FavoritesDownloader.loadZipJS);
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

  /** @type {Boolean} */
  aborted;
  /** @type {Boolean} */
  currentlyDownloading;

  constructor() {
    this.aborted = false;
    this.currentlyDownloading = false;
  }

  /**
   * @param {Post[]} posts
   * @param {{onFetch?: Function, onFetchEnd?: Function, onZipEnd?:Function}} callbacks
   */
  async downloadPosts(posts, callbacks) {
    if (this.currentlyDownloading) {
      return;
    }
    this.currentlyDownloading = true;
    const requests = await this.getDownloadRequests(posts);

    this.checkIfAborted();
    const zippedBlob = await this.zipFiles(requests, callbacks.onFetch);

    this.checkIfAborted();

    if (callbacks.onFetchEnd) {
      callbacks.onFetchEnd();
    }
    this.downloadBlob(zippedBlob);
    this.currentlyDownloading = false;
  }

  /**
   * @param {DownloadRequest[]} requests
   * @param {Function | undefined} onFetch
   * @returns {Promise<Blob>}
   */
  async zipFiles(requests, onFetch) {
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
    const chunks = Utils.splitIntoChunks(requests, 10);

    for (const chunk of chunks) {
      this.checkIfAborted();

      await Promise.all(chunk.map(async(request) => {
        this.checkIfAborted();

        try {
          const blob = await request.blob();

          this.checkIfAborted();
          await this.zipFile(zipWriter, request, blob);
          this.checkIfAborted();
        } catch (error) {
          console.error(error);
        }

        if (onFetch) {
          onFetch();
        }
      }));
      this.checkIfAborted();
    }
    return zipWriter.close();
  }

  /**
   * @param {any} zipWriter
   * @param {DownloadRequest} request
   * @param {Blob} blob
   */
  async zipFile(zipWriter, request, blob) {
    const reader = new zip.BlobReader(blob);

    await zipWriter.add(request.filename, reader, {
      compression: "STORE"
    });
    this.checkIfAborted();
  }

  /**
   * @param {Post[]} posts
   * @returns {Promise<DownloadRequest[]>}
   */
  async getDownloadRequests(posts) {
    const chunks = Utils.splitIntoChunks(posts, 100);
    /** @type {DownloadRequest[]} */
    let result = [];

    for (const chunk of chunks) {
      this.checkIfAborted();

      const requests = await Promise.all(chunk.map(async(post) => {
        this.checkIfAborted();
        const {url, extension} = await post.getOriginalFileURL();

        this.checkIfAborted();
        return new DownloadRequest(post.id, url, extension);
      }));

      this.checkIfAborted();
      result = result.concat(requests);
    }
    return result;
  }

  /**
   * @param {Blob} blob
   * @param {String} filename
   */
  downloadBlob(blob, filename = "download.zip") {
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  checkIfAborted() {
    if (this.aborted) {
      throw new DownloadAbortedError();
    }
  }

  abort() {
    this.aborted = true;
  }

  reset() {
    this.currentlyDownloading = false;
    this.aborted = false;
  }
}
