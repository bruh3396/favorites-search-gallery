Utils.setup();
const favoritesController = new FavoritesController();
const favoritesUI = new FavoritesUI();
const galleryController = new GalleryController();
const tooltip = new Tooltip();
const savedSearches = new SavedSearches();
const caption = new Caption();
const tagModifier = new TagModifier();
const awesompleteWrapper = new AwesompleteWrapper();

Events.global.postProcess.emit();
