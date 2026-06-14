import { FavoritesDrawerTab, FeatureNamespaced, HighlightStyle, Layout, PerformanceProfile, PostOverlayMode, Theme } from "@/types/app";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { Rating, SortKey } from "@/types/search";
import { Preference } from "@/lib/storage/preference";
import { getCookie } from "@/utils/browser/cookie";

export const Preferences = {
  app: {
    performanceProfile: new Preference<PerformanceProfile>("appPerformanceProfile", "normal"),
    surfaceGradient: new Preference("appSurfaceGradient", true),
    theme: new Preference<Theme>("appTheme", getCookie("theme", "") === "dark" ? "native-dark" : "native-light"),
    fadeThumbs: new Preference<boolean>("appFadeThumbs", true)
  },
  favorites: {
    allowedRatings: new Preference<Rating>("favoritesAllowedRatings", 7),
    columnCount: new Preference("favoritesColumnCount", ON_MOBILE_DEVICE ? 3 : 5),
    downloadBatchSize: new Preference("favoritesDownloadBatchSize", 250),
    drawerActiveTab: new Preference<FavoritesDrawerTab>("favoritesDrawerActiveTab", "settings"),
    drawerOpen: new Preference("favoritesDrawerOpen", false),
    excludeBlacklist: new Preference("favoritesExcludeBlacklist", false),
    finderId: new Preference("favoritesFinderId", ""),
    headerEnabled: new Preference("favoritesHeaderEnabled", true),
    hintsEnabled: new Preference("favoritesHintsEnabled", false),
    infiniteScroll: new Preference("favoritesInfiniteScroll", false),
    layout: new Preference<Layout>("favoritesLayout", "column"),
    newFavoriteHighlight: new Preference<HighlightStyle>("favoritesNewFavoriteHighlight", "border"),
    optionsVisible: new Preference("favoritesOptionsVisible", false),
    deletingAllowed: new Preference("favoritesDeletingAllowed", false),
    resultsPerPage: new Preference("favoritesResultsPerPage", 200),
    rowHeight: new Preference("favoritesRowHeight", 7),
    settingsCollapsedSections: new Preference<Record<string, boolean>>("favoritesSettingsCollapsedSections", {}),
    sortAscending: new Preference("favoritesSortAscending", false),
    sortKey: new Preference<SortKey>("favoritesSortKey", "default"),
    tooltipEnabled: new Preference("favoritesTooltipEnabled", false)
  },
  gallery: {
    autoplayActive: new Preference("galleryAutoplayActive", false),
    autoplayForward: new Preference("galleryAutoplayForward", true),
    autoplayImageDuration: new Preference("galleryAutoplayImageDuration", 3_000),
    autoplayMinimumVideoDuration: new Preference("galleryAutoplayMinimumVideoDuration", 5_000),
    autoplayPaused: new Preference("galleryAutoplayPaused", false),
    backgroundOpacity: new Preference("galleryBackgroundOpacity", "1"),
    colorScheme: new Preference("galleryColorScheme", "black"),
    menuDockedLeft: new Preference("galleryMenuDockedLeft", ON_DESKTOP_DEVICE),
    menuEnabled: new Preference("galleryMenuEnabled", ON_MOBILE_DEVICE),
    menuPinned: new Preference("galleryMenuPinned", ON_MOBILE_DEVICE),
    mobileEnabled: new Preference("galleryMobileEnabled", true),
    previewEnabled: new Preference("galleryPreviewEnabled", false),
    videoMuted: new Preference("galleryVideoMuted", false),
    videoVolume: new Preference("galleryVideoVolume", 1)
  },
  postOverlay: {
    enabled: new Preference("postOverlayEnabled", false),
    mode: new Preference<PostOverlayMode>("postOverlayMode", "tag")
  },
  savedSearches: {
    suggestions: new Preference("savedSearchesSuggestions", false),
    tutorial: new Preference("savedSearchesTutorial", false)
  },
  postList: {
    enabled: new Preference("postListEnabled", false),
    columnCount: new Preference("postListColumnCount", ON_MOBILE_DEVICE ? 3 : 6),
    favoriteIndicator: new Preference("postListFavoriteIndicator", false),
    favoriteIndicatorStyle: new Preference<HighlightStyle>("postListFavoriteIndicatorStyle", "border"),
    galleryFavoriteStyle: new Preference<HighlightStyle>("postListGalleryFavoriteStyle", "border"),
    infiniteScroll: new Preference("postListInfiniteScroll", false),
    layout: new Preference<Layout>("postListLayout", "column"),
    rowHeight: new Preference("postListRowHeight", 7),
    tooltipEnabled: new Preference("postListTooltipEnabled", false),
    upscaleThumbs: new Preference("postListUpscaleThumbs", ON_DESKTOP_DEVICE)
  }
} satisfies FeatureNamespaced;
