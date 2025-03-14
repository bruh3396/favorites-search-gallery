class FavoritesSearchGallery {
  /* eslint-disable no-new */
  constructor() {
    Utils.setup();

    new FavoritesController();
    new FavoritesUI();
    new GalleryController();
    new Tooltip();
    new SavedSearches();
    new Caption();
    new TagModifier();
    new AwesompleteWrapper();

    Events.global.postProcess.emit();
  }
}

new FavoritesSearchGallery();
