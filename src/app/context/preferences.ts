import { ActionBarButton, ActionBarMode } from "@/lib/thumb/action_bar";
import { FeatureNamespace, Layout, PerformanceProfile, PostOverlayMode } from "@/types/app";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { Rating, SortKey } from "@/types/search";
import { FavoritesDrawerView } from "@/types/favorite";
import { Preference } from "@/lib/storage/preference";
import { Theme } from "@/lib/ui/theme/themes";
import { readCookie } from "@/utils/browser/cookie";

export const Preferences = {
  app: {
    performanceProfile: new Preference<PerformanceProfile>("appPerformanceProfile", ON_MOBILE_DEVICE ? "medium" : "normal"),
    gradient: new Preference("appGradient", false),
    theme: new Preference<Theme>("appTheme", "native"),
    darkMode: new Preference<boolean>("appDarkMode", readCookie("theme") === "dark"),
    fadeThumbs: new Preference<boolean>("appFadeThumbs", true),
    nativeFont: new Preference<boolean>("appNativeFont", true)
  },
  favorites: {
    allowedRatings: new Preference<Rating>("favoritesAllowedRatings", 7),
    columnCount: new Preference("favoritesColumnCount", ON_MOBILE_DEVICE ? 2 : 5),
    postActionBar: new Preference<ActionBarMode>("favoritesPostActionBar", ON_MOBILE_DEVICE ? "off" : "hover"),
    postActionBarButtons: new Preference("favoritesPostActionBarButtons", ON_DESKTOP_DEVICE ? ActionBarButton.Favorite : ActionBarButton.Favorite | ActionBarButton.Open),
    downloadBatchSize: new Preference("favoritesDownloadBatchSize", 100),
    downloadFilenameFormat: new Preference("favoritesDownloadFilenameFormat", 3),
    drawerActiveView: new Preference<FavoritesDrawerView>("favoritesDrawerActiveView", "settings"),
    drawerOpen: new Preference("favoritesDrawerOpen", false),
    excludeBlacklist: new Preference("favoritesExcludeBlacklist", false),
    headerEnabled: new Preference("favoritesHeaderEnabled", true),
    hintsEnabled: new Preference("favoritesHintsEnabled", ON_DESKTOP_DEVICE),
    infiniteScroll: new Preference("favoritesInfiniteScroll", ON_MOBILE_DEVICE),
    layout: new Preference<Layout>("favoritesLayout", "column"),
    deletingAllowed: new Preference("favoritesDeletingAllowed", false),
    resultsPerPage: new Preference("favoritesResultsPerPage", 100),
    rowHeight: new Preference("favoritesRowHeight", 7),
    settingsExpandedSections: new Preference<Record<string, boolean>>("favoritesSettingsExpandedSections", {}),
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
    backgroundOpacity: new Preference("galleryBackgroundOpacity", 1),
    menuDockedLeft: new Preference("galleryMenuDockedLeft", ON_DESKTOP_DEVICE),
    menuEnabled: new Preference("galleryMenuEnabled", ON_MOBILE_DEVICE),
    menuPinned: new Preference("galleryMenuPinned", ON_MOBILE_DEVICE),
    mobileEnabled: new Preference("galleryMobileEnabled", true),
    previewEnabled: new Preference("galleryPreviewEnabled", false),
    themedBackground: new Preference("galleryThemedBackground", false),
    videoMuted: new Preference("galleryVideoMuted", false),
    videoVolume: new Preference("galleryVideoVolume", 1)
  },
  postOverlay: {
    enabled: new Preference("postOverlayEnabled", false),
    mode: new Preference<PostOverlayMode>("postOverlayMode", "tag")
  },
  postList: {
    enabled: new Preference("postListEnabled", false),
    columnCount: new Preference("postListColumnCount", ON_MOBILE_DEVICE ? 3 : 6),
    favoriteIndicator: new Preference("postListFavoriteIndicator", false),
    layout: new Preference<Layout>("postListLayout", "column"),
    infiniteScroll: new Preference("postListInfiniteScroll", false),
    postActionBar: new Preference<ActionBarMode>("postListPostActionBar", ON_MOBILE_DEVICE ? "always" : "hover"),
    postActionBarButtons: new Preference("postListPostActionBarButtons", ActionBarButton.Favorite),
    rowHeight: new Preference("postListRowHeight", 7),
    settingsCollapsed: new Preference("postListSettingsCollapsed", false),
    tooltipEnabled: new Preference("postListTooltipEnabled", false),
    upscaleThumbs: new Preference("postListUpscaleThumbs", ON_DESKTOP_DEVICE)
  }
} satisfies FeatureNamespace;
