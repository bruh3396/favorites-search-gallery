class ImageUtils {
  /** @type {RegExp} */
  static thumbnailSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;

  /**
   * @param {String} compressedSource
   * @param {String} id
   * @returns {String}
   */
  static decompressThumbnailSource(compressedSource, id) {
    const splitSource = compressedSource.split("_");
    return `https://us.rule34.xxx/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg?${id}`;
  }

  /**
   * @param {String} source
   * @returns {String}
   */
  static compressThumbSource(source) {
    const match = source.match(ImageUtils.thumbnailSourceCompressionRegex);
    return match === null ? "" : match.splice(1).join("_");
  }

  /**
   * @param {String} source
   * @param {String} id
   * @returns {String}
   */
  static cleanThumbnailSource(source, id) {
    return ImageUtils.decompressThumbnailSource(ImageUtils.compressThumbSource(source), id);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getOriginalImageURL(thumb) {
    const image = Utils.getImageFromThumb(thumb);
    const thumbURL = image === null ? "" : image.src;
    return ImageUtils.getOriginalImageURLFromIdAndThumbURL(thumb.id, thumbURL);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Promise<String>}
   */
  static async getOriginalImageURLWithExtension(thumb) {
    const extension = await ImageUtils.getImageExtensionFromThumb(thumb);
    return ImageUtils.getOriginalImageURL(thumb).replace(".jpg", `.${extension}`);
  }

  /**
   * @param {String} id
   * @param {String} thumbURL
   * @returns {String}
   */
  static getOriginalImageURLFromIdAndThumbURL(id, thumbURL) {
    const cleanedThumbSource = ImageUtils.cleanThumbnailSource(thumbURL, id);
    return cleanedThumbSource
      .replace("thumbnails", "/images")
      .replace("thumbnail_", "")
      .replace("us.rule34", "rule34");
  }

  /**
   * @param {String} imageURL
   * @returns {MediaExtension}
   */
  static getExtensionFromImageURL(imageURL) {
    const match = (/\.(png|jpg|jpeg|gif|mp4)/g).exec(imageURL);

    if (match === null || !Types.isMediaExtension(match[1])) {
      return Settings.defaultExtension;
    }
    return match[1];
  }
  /**
   *
   * @param {HTMLImageElement} image
   * @returns {Boolean}
   */
  static imageIsLoaded(image) {
    return image.complete || image.naturalWidth !== 0;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Promise<MediaExtension>}
   */
  static getImageExtensionFromThumb(thumb) {
    if (Utils.isVideo(thumb)) {
      return Promise.resolve("mp4");
    }

    if (Utils.isGif(thumb)) {
      return Promise.resolve("gif");
    }
    return ImageUtils.getImageExtensionFromId(thumb.id);
  }

  /**
   * @param {String} id
   * @returns {Promise<MediaExtension>}
   */
  static getImageExtensionFromId(id) {
    if (Extensions.has(id)) {
      // @ts-ignore
      return Promise.resolve(Extensions.get(id));
    }
    return ImageUtils.fetchImageExtension(id);
  }

  /**
   * @param {String} id
   * @returns {Promise<MediaExtension>}
   */
  static fetchImageExtension(id) {
    return new APIPost(id).fetch()
      .then((apiPost) => {
        Extensions.set(id, apiPost.extension);
        return apiPost.extension;
      });
  }

  /**
   * @param {HTMLElement} thumb
   */
  static async openOriginalImageInNewTab(thumb) {
    try {
      const imageURL = await ImageUtils.getOriginalImageURLWithExtension(thumb);

      window.open(imageURL);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * @param {String} id
   * @param {String} thumbURL
   */
  static async getOriginalImageURLWithExtensionFromIdAndThumbURL(id, thumbURL) {
    const extension = await this.getImageExtensionFromId(id);
    return ImageUtils.getOriginalImageURLFromIdAndThumbURL(id, thumbURL).replace(".jpg", `.${extension}`);
  }

  /**
   * @param {Post[]} posts
   */
  static preloadImagesFromPosts(posts) {
    setTimeout(() => {
      ImageUtils.preloadImages(posts.map(post => post.thumbURL));
    }, 100);
  }

  /**
   * @param {String[]} imageURLs
   */
  static preloadImages(imageURLs) {
    for (const imageURL of imageURLs) {
      ImageUtils.preloadImage(imageURL);
    }
  }

  /**
   * @param {String} imageURL
   */
  static preloadImage(imageURL) {
    const preloadedImage = new Image();

    preloadedImage.src = imageURL;
  }
}
