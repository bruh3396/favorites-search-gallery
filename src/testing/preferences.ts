import { Preferences } from "@/app/context/preferences";

export type PreferenceOverrides = {
  [Section in keyof Preferences]?: {
    [Key in keyof Preferences[Section]]?: Preferences[Section][Key] extends { value: infer V } ? V : never;
  };
};

export function createPreferences(overrides: PreferenceOverrides = {}): Preferences {
  const preferences = {
    app: {
      darkMode: { value: false },
      fadeThumbs: { value: false },
      gradient: { value: false },
      nativeFont: { value: true },
      performanceProfile: { value: "normal" },
      theme: { value: "native" }
    },
    favorites: {
      allowedRatings: { value: 7 },
      columnCount: { value: 5 },
      downloadBatchSize: { value: 500 },
      downloadFilenameFormat: { value: 3 },
      drawerActiveView: { value: "settings" },
      drawerOpen: { value: false },
      excludeBlacklist: { value: false },
      headerEnabled: { value: true },
      hintsEnabled: { value: true },
      infiniteScroll: { value: false },
      layout: { value: "column" },
      postActionBar: { value: "hover" },
      postActionBarButtons: { value: 1 },
      resultsPerPage: { value: 100 },
      rowHeight: { value: 7 },
      settingsExpandedSections: { value: {} },
      sortAscending: { value: false },
      sortKey: { value: "default" },
      tooltipEnabled: { value: false },
      upscaleQuality: { value: 1 },
      upscaleThumbs: { value: true }
    },
    gallery: {
      autoplayActive: { value: false },
      autoplayForward: { value: true },
      autoplayImageDuration: { value: 3_000 },
      autoplayMinimumVideoDuration: { value: 5_000 },
      autoplayPaused: { value: false },
      backgroundOpacity: { value: 1 },
      menuDockedLeft: { value: true },
      menuEnabled: { value: false },
      menuPinned: { value: false },
      mobileEnabled: { value: true },
      previewEnabled: { value: false },
      themedBackground: { value: false },
      tutorialSeen: { value: false },
      videoMuted: { value: false },
      videoVolume: { value: 1 }
    },
    postOverlay: {
      enabled: { value: false },
      mode: { value: "tag" }
    },
    postList: {
      columnCount: { value: 5 },
      enabled: { value: false },
      favoriteIndicator: { value: false },
      infiniteScroll: { value: false },
      layout: { value: "column" },
      postActionBar: { value: "hover" },
      postActionBarButtons: { value: 1 },
      rowHeight: { value: 7 },
      settingsCollapsed: { value: false },
      tooltipEnabled: { value: false },
      upscaleQuality: { value: 1 },
      upscaleThumbs: { value: true }
    }
  } as unknown as Preferences;

  for (const [section, keys] of Object.entries(overrides)) {
    for (const [key, value] of Object.entries(keys as Record<string, unknown>)) {
      (preferences as unknown as Record<string, Record<string, { value: unknown }>>)[section][key] = { value };
    }
  }
  return preferences;
}
