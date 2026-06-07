import { FavoriteIndicatorStyle, FavoritesDrawerTab, GalleryFavoriteStyle, Layout, PerformanceProfile, PostOverlayMode, Theme } from "@/types/ui";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { Rating, SortingMethod } from "@/types/search";
import { Preference } from "@/lib/storage/preference";
import { getCookie } from "@/utils/browser/cookie";

export const Preferences = {
  appPerformanceProfile: new Preference<PerformanceProfile>("appPerformanceProfile", "normal"),
  appTheme: new Preference<Theme>("appTheme", getCookie("theme", "") === "dark" ? "native-dark" : "native-light"),

  favoritesAddButtonsVisible: new Preference("favoritesAddButtonsVisible", false),
  favoritesAllowedRatings: new Preference<Rating>("favoritesAllowedRatings", 7),
  favoritesColumnCount: new Preference("favoritesColumnCount", ON_MOBILE_DEVICE ? 3 : 6),
  favoritesDownloadBatchSize: new Preference("favoritesDownloadBatchSize", 250),
  favoritesDownloadButtonsVisible: new Preference("favoritesDownloadButtonsVisible", false),
  favoritesDrawerActiveTab: new Preference<FavoritesDrawerTab>("favoritesDrawerActiveTab", "settings"),
  favoritesDrawerOpen: new Preference("favoritesDrawerOpen", false),
  favoritesExcludeBlacklist: new Preference("favoritesExcludeBlacklist", false),
  favoritesFinderId: new Preference("favoritesFinderId", ""),
  favoritesHeaderEnabled: new Preference("favoritesHeaderEnabled", true),
  favoritesHintsEnabled: new Preference("favoritesHintsEnabled", false),
  favoritesInfiniteScroll: new Preference("favoritesInfiniteScroll", false),
  favoritesLayout: new Preference<Layout>("favoritesLayout", "tiler--column"),
  favoritesOptionsVisible: new Preference("favoritesOptionsVisible", false),
  favoritesRemoveButtonsVisible: new Preference("favoritesRemoveButtonsVisible", false),
  favoritesResultsPerPage: new Preference("favoritesResultsPerPage", 125),
  favoritesRowHeight: new Preference("favoritesRowHeight", 7),
  favoritesSortAscending: new Preference("favoritesSortAscending", false),
  favoritesSortKey: new Preference<SortingMethod>("favoritesSortKey", "default"),
  favoritesTooltipEnabled: new Preference("tooltipEnabled", false),

  galleryAutoplayActive: new Preference("galleryAutoplayActive", false),
  galleryAutoplayForward: new Preference("galleryAutoplayForward", true),
  galleryAutoplayImageDuration: new Preference("galleryAutoplayImageDuration", 3_000),
  galleryAutoplayMinimumVideoDuration: new Preference("galleryAutoplayMinimumVideoDuration", 5_000),
  galleryAutoplayPaused: new Preference("galleryAutoplayPaused", false),
  galleryBackgroundOpacity: new Preference("galleryBackgroundOpacity", "1"),
  galleryColorScheme: new Preference("galleryColorScheme", "black"),
  galleryMenuDockedLeft: new Preference("galleryMenuDockedLeft", ON_DESKTOP_DEVICE),
  galleryMenuEnabled: new Preference("galleryMenuEnabled", ON_MOBILE_DEVICE),
  galleryMenuPinned: new Preference("galleryMenuPinned", ON_MOBILE_DEVICE),
  galleryMobileEnabled: new Preference("galleryMobileEnabled", true),
  galleryPreviewEnabled: new Preference("galleryPreviewEnabled", false),
  galleryVideoMuted: new Preference("galleryVideoMuted", false),
  galleryVideoVolume: new Preference("galleryVideoVolume", 1),

  postOverlayEnabled: new Preference("postOverlayEnabled", false),
  postOverlayMode: new Preference<PostOverlayMode>("postOverlayMode", "tag"),

  savedSearchesSuggestions: new Preference("savedSearchesSuggestions", false),
  savedSearchesTutorial: new Preference("savedSearchesTutorial", false),
  savedSearchesVisible: new Preference("savedSearchesVisible", false),

  searchPageAddButtonsVisible: new Preference("searchPageAddButtonsVisible", false),
  searchPageColumnCount: new Preference("searchPageColumnCount", ON_MOBILE_DEVICE ? 3 : 6),
  searchPageEnabled: new Preference("searchPageEnabled", true),
  searchPageFavoriteIndicator: new Preference("searchPageFavoriteIndicator", false),
  searchPageFavoriteIndicatorStyle: new Preference<FavoriteIndicatorStyle>("searchPageFavoriteIndicatorStyle", "border"),
  searchPageGalleryFavoriteStyle: new Preference<GalleryFavoriteStyle>("searchPageGalleryFavoriteStyle", "border"),
  searchPageInfiniteScroll: new Preference("searchPageInfiniteScroll", false),
  searchPageLayout: new Preference<Layout>("searchPageLayout", "tiler--column"),
  searchPageRowHeight: new Preference("searchPageRowHeight", 7),
  searchPageTooltipEnabled: new Preference("searchPageTooltipEnabled", false),
  searchPageUpscaleThumbs: new Preference("searchPageUpscaleThumbs", ON_DESKTOP_DEVICE)
};
