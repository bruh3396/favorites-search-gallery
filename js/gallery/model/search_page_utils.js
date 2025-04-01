class SearchPageUtils {
  /**
   * @param {HTMLElement[]} thumbs
   */
  static prepareThumbs(thumbs) {
    for (const thumb of thumbs) {
      SearchPageUtils.prepareThumb(thumb);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  static async prepareThumb(thumb) {
    Utils.prepareSearchPageThumb(thumb);
    const apiPost = await new APIPost(thumb.id).fetch();

    Extensions.set(thumb.id, apiPost.extension);
    SearchPageUtils.correctMediaTags(thumb, apiPost);

  }

  /**
   * @param {HTMLElement} thumb
   * @param {APIPost} apiPost
   */
  static correctMediaTags(thumb, apiPost) {
    if (!Flags.onSearchPage) {
      return;
    }
    const tagSet = Utils.convertToTagSet(apiPost.tags);
    const isVideo = apiPost.fileURL.endsWith("mp4");
    const isGif = apiPost.fileURL.endsWith("gif");
    const isImage = !isVideo && !isGif;
    const documentThumb = document.getElementById(thumb.id);

    if (isImage) {
      SearchPageUtils.removeAnimatedTags(tagSet);
      SearchPageUtils.removeAnimatedAttributes(thumb);
      SearchPageUtils.removeAnimatedAttributes(documentThumb);
    } else if (isVideo) {
      tagSet.add("video");
    } else if (isGif) {
      tagSet.add("gif");
    }
    Utils.setThumbTagsOnSearchPage(thumb, Utils.convertToTagString(tagSet));
    Utils.setThumbTagsOnSearchPage(documentThumb, Utils.convertToTagString(tagSet));
  }

  /**
   * @param {Set<String>} tagSet
   */
  static removeAnimatedTags(tagSet) {
    tagSet.delete("animated");
    tagSet.delete("video");
    tagSet.delete("mp4");
    tagSet.delete("gif");
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  static removeAnimatedAttributes(thumb) {
    if (thumb === null) {
      return;
    }
    thumb.classList.remove("video");
    thumb.classList.remove("gif");

    const image = Utils.getImageFromThumb(thumb);

    if (image === null) {
      return;
    }
    image.classList.remove("video");
    image.classList.remove("gif");
  }
}
