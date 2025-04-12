class FavoritesDownloadMenu {
  /** @type {HTMLDialogElement} */
  dialog;
  /** @type {HTMLDialogElement} */
  warningDialog;
  /** @type {HTMLButtonElement} */
  downloadButton;
  /** @type {HTMLButtonElement} */
  cancelButton;
  /** @type {HTMLElement} */
  statusContainer;
  /** @type {HTMLElement} */
  statusHeader;
  /** @type {FavoritesDownloader} */
  downloader;
  /** @type {Boolean} */
  favoritesLoaded;

  constructor() {
    if (Flags.onMobileDevice) {
      return;
    }
    FavoritesSearchGalleryContainer.insertHTML("beforeend", HTMLStrings.downloader);
    this.dialog = this.getDialog("download-menu");
    this.warningDialog = this.getDialog("download-menu-warning");
    this.downloadButton = this.getDownloadButton();
    this.cancelButton = this.getCancelButton();
    this.statusContainer = this.getStatusContainer();
    this.statusHeader = this.getStatusHeader();
    this.downloader = new FavoritesDownloader();
    this.favoritesLoaded = false;
    this.addEventListeners();
  }

  /**
   * @param {String} id
   * @returns {HTMLDialogElement}
   */
  getDialog(id) {
    const dialog = document.getElementById(id);
    return dialog instanceof HTMLDialogElement ? dialog : document.createElement("dialog");
  }

  /**
   * @returns {HTMLButtonElement}
   */
  getDownloadButton() {
    const button = document.getElementById("download-menu-start-download");

    if (!(button instanceof HTMLButtonElement)) {
      return document.createElement("button");
    }
    button.addEventListener("click", () => {
      button.disabled = true;
      this.downloadFavorites(FavoritesSearchResultObserver.latestSearchResults);
    });
    return button;
  }

  /**
   * @returns {HTMLButtonElement}
   */
  getCancelButton() {
    const button = document.getElementById("download-menu-cancel-download");

    if (!(button instanceof HTMLButtonElement)) {
      return document.createElement("button");
    }
    button.addEventListener("click", () => {
      this.dialog.close();
    });
    return button;
  }

  /**
   * @returns {HTMLElement}
   */
  getStatusContainer() {
    const container = document.getElementById("download-menu-status-container");

    if (!(container instanceof HTMLElement)) {
      return document.createElement("div");
    }
    return container;
  }

  /**
   * @returns {HTMLElement}
   */
  getStatusHeader() {
    const header = document.getElementById("download-menu-status-header");

    if (!(header instanceof HTMLElement)) {
      return document.createElement("div");
    }
    return header;
  }

  /**
   * @returns {HTMLElement}
   */
  createStatusTextRow() {
    const row = document.createElement("span");

    row.classList.add("download-menu-status-row");
    this.statusContainer.appendChild(row);
    return row;
  }

  addEventListeners() {
    this.enableAfterFavoritesLoad();
    this.openWhenDownloadButtonClicked();
    this.setupMenuCancelHandler();
    this.setupMenuCloseHandler();
    this.setupMenuOptions();
  }

  enableAfterFavoritesLoad() {
    Events.favorites.favoritesLoaded.on(() => {
      this.favoritesLoaded = true;
    }, {
      once: true
    });
  }

  openWhenDownloadButtonClicked() {
    Events.favorites.downloadButtonClicked.on(() => {

      if (this.favoritesLoaded) {
        this.downloadButton.disabled = false;
        this.dialog.showModal();
        this.statusHeader.textContent = `Download ${FavoritesSearchResultObserver.latestSearchResults.length} Results`;
      } else {
        this.warningDialog.showModal();
      }
      document.body.classList.add("download-menu-open");

    });
  }

  setupMenuCancelHandler() {
    this.dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
    });
  }

  setupMenuCloseHandler() {
    this.dialog.addEventListener("close", async() => {
      this.cancelButton.textContent = "Cancel";
      await Utils.yield();
      document.body.classList.remove("download-menu-open");
      this.dialog.classList.remove("downloading");
      this.downloader.abort();
      this.clearStatusTextRows();
      this.downloadButton.disabled = true;
      await Utils.sleep(2000);
      this.downloadButton.disabled = false;
      this.downloader.reset();
    });
    this.warningDialog.addEventListener("close", () => {
      document.body.classList.remove("download-menu-open");
    });
  }

  setupMenuOptions() {
    this.setupMenuBatchSizeSelect();
  }

  setupMenuBatchSizeSelect() {
    const batchSizeSelect = document.getElementById("download-menu-options-batch-size");

    if (!(batchSizeSelect instanceof HTMLSelectElement)) {
      return;
    }
    batchSizeSelect.value = String(Preferences.downloadBatchSize.value);

    batchSizeSelect.addEventListener("change", () => {
      Preferences.downloadBatchSize.set(parseInt(batchSizeSelect.value));
    });
  }

  clearStatusTextRows() {
    const rows = Array.from(this.statusContainer.querySelectorAll(".download-menu-status-row"));

    for (const row of rows) {
      row.remove();
    }
  }

  /**
   * @param {Post[]} favorites
   */
  async downloadFavorites(favorites) {
    const postCount = favorites.length;

    if (postCount === 0) {
      return;
    }
    this.dialog.classList.add("downloading");
    const batches = Utils.splitIntoChunks(favorites, Preferences.downloadBatchSize.value);
    const totalProgressRow = this.createStatusTextRow();
    const batchProgressRow = this.createStatusTextRow();
    const currentProgressRow = this.createStatusTextRow();
    let totalCount = 0;
    let currentBatchCount = 0;
    let currentBatchLength = 0;

    const onFetch = () => {
      totalCount += 1;
      currentBatchCount += 1;
      totalProgressRow.textContent = `Total: ${totalCount} / ${postCount}`;
      currentProgressRow.textContent = `Downloading: ${currentBatchCount} / ${currentBatchLength}`;
    };

    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i];

      currentBatchCount = 0;
      currentBatchLength = batch.length;

      batchProgressRow.textContent = `Batch: ${i + 1} / ${batches.length}`;
      totalProgressRow.textContent = `Total ${batch.length} posts`;

      await this.downloader.downloadPosts(batch, {
        onFetch
      });
    }
    this.clearStatusTextRows();
    this.createStatusTextRow().textContent = "Download complete";
    this.cancelButton.textContent = "Exit";

  }
}
