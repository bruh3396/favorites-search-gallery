class FavoritesSearchGallery {
  constructor() {
    if (Flags.favoritesSearchGalleryDisabled) {
      throw new Error("Favorites Search Gallery disabled");
    }
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
