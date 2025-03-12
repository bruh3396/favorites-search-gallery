class Preferences {
  static savedSearchSuggestions = new Preference("savedSearchSuggestions", false);
  static savedSearchVisibility = new Preference("savedSearchVisibility", false);
  static savedSearchTutorial = new Preference("savedSearchTutorial", false);
  static showCaptions = new Preference("showCaptions", true);
  static showTooltip = new Preference("showTooltip", true);
  static showOnHover = new Preference("showOnHover", true);
  static allowedRatings = new Preference("allowedRatings", 7);
  static favoriteFinder = new Preference("findFavorite", "");
  static enableOnSearchPages = new Preference("enableOnSearchPages", false);
  static performanceProfile = new Preference("performanceProfile", 0);
  static layout = new Preference("layout", "column");
  static excludeBlacklist = new Preference("excludeBlacklist", false);
  static resultsPerPage = new Preference("resultsPerPage", 150);
  static sortAscending = new Preference("sortAscending", false);

  /** @type {Preference<MetadataMetric>}*/
  static sortingMethod = new Preference("sortingMethod", "default");

  static showOptions = new Preference("showOptions", false);
  static columnCount = new Preference("columnCount", 6);
  static rowSize = new Preference("rowSize", 4);
  static dockGalleryMenuLeft = new Preference("dockGalleryMenuLeft", true);
  static showUI = new Preference("showUI", true);
  static galleryMenuPinned = new Preference("galleryMenuPinned", true);
  static galleryMenuEnabled = new Preference("galleryMenuEnabled", true);
  static showRemoveFavoriteButtons = new Preference("showRemoveFavoriteButtons", false);
  static showAddFavoriteButtons = new Preference("showAddFavoriteButtons", true);
  static fancyThumbHovering = new Preference("fancyThumbHovering", true);
  static showHints = new Preference("showHints", false);
  static showHeader = new Preference("showHeader", true);
  static colorScheme = new Preference("colorScheme", "black");
  static backgroundOpacity = new Preference("backgroundOpacity", "1");
  static videoVolume = new Preference("videoVolume", 1);
  static videoMuted = new Preference("videoMuted", false);
  static autoplayActive = new Preference("autoplayActive", false);
  static autoplayPaused = new Preference("autoplayPaused", false);
  static autoplayImageDuration = new Preference("autoplayImageDuration", 3000);
  static autoplayMinimumVideoDuration = new Preference("autoplayMinimumVideoDuration", 5000);
  static autoplayForward = new Preference("autoplayForward", true);
}
