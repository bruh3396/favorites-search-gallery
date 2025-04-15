class FavoritesSearchGallery {
  constructor() {
    if (Flags.favoritesSearchGalleryDisabled) {
      return;
    }
    Utils.setup();
    new FavoritesController();
    new GalleryController();
    new AddonController();
    Utils.postProcess();
  }
}

new FavoritesSearchGallery();
