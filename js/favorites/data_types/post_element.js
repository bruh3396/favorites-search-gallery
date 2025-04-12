class PostHTMLElement {
  /** @type {RegExp} */
  static thumbnailSourceCompressionRegex = /thumbnails\/\/([0-9]+)\/thumbnail_([0-9a-f]+)/;
  /** @type {HTMLElement} */
  static htmlTemplate;
  /** @type {String} */
  static removeFavoriteButtonHTML;
  /** @type {String} */
  static addFavoriteButtonHTML;
  static {
    if (Flags.onFavoritesPage) {
      Utils.addStaticInitializer(() => {
        PostHTMLElement.createHTMLTemplates();

      });
    }
  }

  static createHTMLTemplates() {
    PostHTMLElement.createAddFavoriteButtonHTMLTemplate();
    PostHTMLElement.createRemoveFavoriteButtonHTMLTemplate();
    PostHTMLElement.createPostHTMLTemplate();
  }

  static createRemoveFavoriteButtonHTMLTemplate() {
    PostHTMLElement.removeFavoriteButtonHTML = `<img class="remove-favorite-button add-or-remove-button" src=${Utils.createObjectURLFromSvg(SVGIcons.heartMinus)}>`;
  }

  static createAddFavoriteButtonHTMLTemplate() {
    PostHTMLElement.addFavoriteButtonHTML = `<img class="add-favorite-button add-or-remove-button" src=${Utils.createObjectURLFromSvg(SVGIcons.heartPlus)}>`;
  }

  static createPostHTMLTemplate() {
    const buttonHTML = Flags.userIsOnTheirOwnFavoritesPage ? PostHTMLElement.removeFavoriteButtonHTML : PostHTMLElement.addFavoriteButtonHTML;
    const canvasHTML = Preferences.performanceProfile.value > 0 ? "" : "<canvas></canvas>";
    const containerTagName = "a";

    PostHTMLElement.htmlTemplate = new DOMParser().parseFromString("", "text/html").createElement("div");
    PostHTMLElement.htmlTemplate.className = Utils.favoriteItemClassName;
    PostHTMLElement.htmlTemplate.innerHTML = `
        <${containerTagName}>
          <img>
          ${buttonHTML}
          ${canvasHTML}
        </${containerTagName}>
    `;
  }

  /** @type {HTMLElement} */
  root;
  /** @type {HTMLAnchorElement} */
  container;
  /** @type {HTMLImageElement} */
  image;
  /** @type {HTMLImageElement} */
  addOrRemoveButton;

  /** @type {String} */
  get thumbURL() {
    return this.image.src;
  }

  /**
   * @param {PostData} postData
   * @param {PostMetadata} metadata
   */
  initialize(postData, metadata) {
    this.instantiateTemplate();
    this.populateAttributes(postData);
    this.setupAddOrRemoveButton(Flags.userIsOnTheirOwnFavoritesPage);
    this.openAssociatedPostInNewTabWhenClicked();
    this.presetCanvasDimensions(metadata);
  }

  instantiateTemplate() {
    // @ts-ignore
    this.root = PostHTMLElement.htmlTemplate.cloneNode(true);
    // @ts-ignore
    this.container = this.root.children[0];
    // @ts-ignore
    this.image = this.root.children[0].children[0];
    // @ts-ignore
    this.addOrRemoveButton = this.root.children[0].children[1];
  }

  /**
   * @param {PostData} postData
   */
  populateAttributes(postData) {
    this.image.src = postData.src;
    this.image.classList.add(postData.contentType);
    this.root.id = postData.id;
  }

  /**
   * @param {Boolean} isRemoveButton
   */
  setupAddOrRemoveButton(isRemoveButton) {
    if (isRemoveButton) {
      this.addOrRemoveButton.onmousedown = (event) => {
        event.stopPropagation();

        if (event.button === Utils.clickCodes.left) {
          this.removeFavorite();
        }
      };
    } else {
      this.addOrRemoveButton.onmousedown = (event) => {
        event.stopPropagation();

        if (event.button === Utils.clickCodes.left) {
          this.addFavorite();
        }
      };
    }
  }

  removeFavorite() {
    Utils.removeFavorite(this.root.id);
    this.swapAddOrRemoveButton();
  }

  addFavorite() {
    Utils.addFavorite(this.root.id);
    this.swapAddOrRemoveButton();
  }

  swapAddOrRemoveButton() {
    const isRemoveButton = this.addOrRemoveButton.classList.contains("remove-favorite-button");

    this.addOrRemoveButton.outerHTML = isRemoveButton ? PostHTMLElement.addFavoriteButtonHTML : PostHTMLElement.removeFavoriteButtonHTML;
    // @ts-ignore
    this.addOrRemoveButton = this.root.children[0].children[1];
    this.setupAddOrRemoveButton(!isRemoveButton);
  }

  openAssociatedPostInNewTabWhenClicked() {
    if (!Flags.onFavoritesPage) {
      return;
    }

    this.container.onclick = (event) => {
      if (event.ctrlKey) {
        ImageUtils.openOriginalImageInNewTab(this.root);
      }
    };
    this.container.addEventListener("mousedown", (event) => {
      if (event.ctrlKey) {
        return;
      }
      const middleClick = event.button === Utils.clickCodes.middle;
      const leftClick = event.button === Utils.clickCodes.left;
      const shiftClick = leftClick && event.shiftKey;

      if (middleClick || shiftClick || (leftClick && Flags.galleryDisabled)) {
        event.preventDefault();
        Utils.openPostInNewTab(this.root.id);
      }
    });
  }

  /**
   * @param {PostMetadata} metadata
   */
  presetCanvasDimensions(metadata) {
    const canvas = this.root.querySelector("canvas");

    if (canvas === null || metadata.isEmpty) {
      return;
    }
    canvas.dataset.size = `${metadata.width}x${metadata.height}`;
  }
}
