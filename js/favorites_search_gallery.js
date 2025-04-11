class FavoritesSearchGallery {
  constructor() {
    if (Flags.favoritesSearchGalleryDisabled) {
      throw new Error("Favorites Search Gallery Disabled");
    }
    Utils.setup();
    new FavoritesController();
    new GalleryController();
    new AddonController();
    Events.global.postProcess.emit();
  }
}

new FavoritesSearchGallery();
