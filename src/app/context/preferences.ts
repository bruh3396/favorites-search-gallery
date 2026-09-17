import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { Layout, PerformanceProfile, PostOverlayMode } from "@/types/app";
import { Rating, SortKey } from "@/types/search";
import { Environment } from "@/app/context/environment";
import { FavoritesDrawerView } from "@/types/favorite";
import { Preference } from "@/lib/storage/preference";
import { Theme } from "@/lib/ui/theme/themes";

export class Preferences {
  public readonly app: {
    darkMode: Preference<boolean>;
    fadeThumbs: Preference<boolean>;
    gradient: Preference<boolean>;
    nativeFont: Preference<boolean>;
    performanceProfile: Preference<PerformanceProfile>;
    theme: Preference<Theme>;
  };

  public readonly favorites: {
    allowedRatings: Preference<Rating>;
    columnCount: Preference<number>;
    downloadBatchSize: Preference<number>;
    downloadFilenameFormat: Preference<number>;
    drawerActiveView: Preference<FavoritesDrawerView>;
    drawerOpen: Preference<boolean>;
    excludeBlacklist: Preference<boolean>;
    headerEnabled: Preference<boolean>;
    hintsEnabled: Preference<boolean>;
    infiniteScroll: Preference<boolean>;
    layout: Preference<Layout>;
    postActionBar: Preference<ActionBarMode>;
    postActionBarButtons: Preference<number>;
    resultsPerPage: Preference<number>;
    rowHeight: Preference<number>;
    settingsExpandedSections: Preference<Record<string, boolean>>;
    sortAscending: Preference<boolean>;
    sortKey: Preference<SortKey>;
    tooltipEnabled: Preference<boolean>;
    upscaleThumbs: Preference<boolean>;
  };

  public readonly gallery: {
    autoplayActive: Preference<boolean>;
    autoplayForward: Preference<boolean>;
    autoplayImageDuration: Preference<number>;
    autoplayMinimumVideoDuration: Preference<number>;
    autoplayPaused: Preference<boolean>;
    backgroundOpacity: Preference<number>;
    menuDockedLeft: Preference<boolean>;
    menuEnabled: Preference<boolean>;
    menuPinned: Preference<boolean>;
    mobileEnabled: Preference<boolean>;
    previewEnabled: Preference<boolean>;
    themedBackground: Preference<boolean>;
    tutorialSeen: Preference<boolean>;
    videoMuted: Preference<boolean>;
    videoVolume: Preference<number>;
  };

  public readonly postOverlay: {
    enabled: Preference<boolean>;
    mode: Preference<PostOverlayMode>;
  };

  public readonly postList: {
    columnCount: Preference<number>;
    enabled: Preference<boolean>;
    favoriteIndicator: Preference<boolean>;
    infiniteScroll: Preference<boolean>;
    layout: Preference<Layout>;
    postActionBar: Preference<ActionBarMode>;
    postActionBarButtons: Preference<number>;
    rowHeight: Preference<number>;
    settingsCollapsed: Preference<boolean>;
    tooltipEnabled: Preference<boolean>;
    upscaleThumbs: Preference<boolean>;
  };

  constructor(environment: Environment) {
    const { onDesktopDevice, onMobileDevice, usingDarkMode } = environment;

    this.app = {
      darkMode: new Preference<boolean>("appDarkMode", usingDarkMode),
      fadeThumbs: new Preference<boolean>("appFadeThumbs", true),
      gradient: new Preference("appGradient", false),
      nativeFont: new Preference<boolean>("appNativeFont", true),
      performanceProfile: new Preference<PerformanceProfile>("appPerformanceProfile", "normal"),
      theme: new Preference<Theme>("appTheme", "native")
    };

    this.favorites = {
      allowedRatings: new Preference<Rating>("favoritesAllowedRatings", 7),
      columnCount: new Preference("favoritesColumnCount", onDesktopDevice ? 5 : 2),
      downloadBatchSize: new Preference("favoritesDownloadBatchSize", 500),
      downloadFilenameFormat: new Preference("favoritesDownloadFilenameFormat", 3),
      drawerActiveView: new Preference<FavoritesDrawerView>("favoritesDrawerActiveView", "settings"),
      drawerOpen: new Preference("favoritesDrawerOpen", false),
      excludeBlacklist: new Preference("favoritesExcludeBlacklist", false),
      headerEnabled: new Preference("favoritesHeaderEnabled", true),
      hintsEnabled: new Preference("favoritesHintsEnabled", onDesktopDevice),
      infiniteScroll: new Preference("favoritesInfiniteScroll", onMobileDevice),
      layout: new Preference<Layout>("favoritesLayout", "column"),
      postActionBar: new Preference<ActionBarMode>("favoritesPostActionBar", onDesktopDevice ? "hover" : "off"),
      postActionBarButtons: new Preference("favoritesPostActionBarButtons", onDesktopDevice ? ActionBarButton.Favorite : ActionBarButton.Favorite | ActionBarButton.Open),
      resultsPerPage: new Preference("favoritesResultsPerPage", 100),
      rowHeight: new Preference("favoritesRowHeight", 7),
      settingsExpandedSections: new Preference<Record<string, boolean>>("favoritesSettingsExpandedSections", {}),
      sortAscending: new Preference("favoritesSortAscending", false),
      sortKey: new Preference<SortKey>("favoritesSortKey", "default"),
      tooltipEnabled: new Preference("favoritesTooltipEnabled", false),
      upscaleThumbs: new Preference("favoritesUpscaleThumbs", true)
    };

    this.gallery = {
      autoplayActive: new Preference("galleryAutoplayActive", false),
      autoplayForward: new Preference("galleryAutoplayForward", true),
      autoplayImageDuration: new Preference("galleryAutoplayImageDuration", 3_000),
      autoplayMinimumVideoDuration: new Preference("galleryAutoplayMinimumVideoDuration", 5_000),
      autoplayPaused: new Preference("galleryAutoplayPaused", false),
      backgroundOpacity: new Preference("galleryBackgroundOpacity", 1),
      menuDockedLeft: new Preference("galleryMenuDockedLeft", onDesktopDevice),
      menuEnabled: new Preference("galleryMenuEnabled", onMobileDevice),
      menuPinned: new Preference("galleryMenuPinned", onMobileDevice),
      mobileEnabled: new Preference("galleryMobileEnabled", true),
      previewEnabled: new Preference("galleryPreviewEnabled", false),
      themedBackground: new Preference("galleryThemedBackground", false),
      tutorialSeen: new Preference("galleryTutorialSeen", false),
      videoMuted: new Preference("galleryVideoMuted", false),
      videoVolume: new Preference("galleryVideoVolume", 1)
    };

    this.postOverlay = {
      enabled: new Preference("postOverlayEnabled", false),
      mode: new Preference<PostOverlayMode>("postOverlayMode", "tag")
    };

    this.postList = {
      columnCount: new Preference("postListColumnCount", onDesktopDevice ? 5 : 2),
      enabled: new Preference("postListEnabled", false),
      favoriteIndicator: new Preference("postListFavoriteIndicator", false),
      infiniteScroll: new Preference("postListInfiniteScroll", false),
      layout: new Preference<Layout>("postListLayout", "column"),
      postActionBar: new Preference<ActionBarMode>("postListPostActionBar", onDesktopDevice ? "hover" : "always"),
      postActionBarButtons: new Preference("postListPostActionBarButtons", ActionBarButton.Favorite),
      rowHeight: new Preference("postListRowHeight", 7),
      settingsCollapsed: new Preference("postListSettingsCollapsed", false),
      tooltipEnabled: new Preference("postListTooltipEnabled", false),
      upscaleThumbs: new Preference("postListUpscaleThumbs", onDesktopDevice)
    };
  }
}
