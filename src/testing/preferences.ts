import { Preferences, createPreferences as createAppPreferences } from "@/app/context/preferences";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Preference, StoredPreference } from "@/lib/storage/preference";
import { createEnvironment } from "@/testing/environment";
import { selectPreferenceDefaults } from "@/app/context/preference_defaults";

type Section = Exclude<keyof Preferences, "reset">;

export type PreferenceOverrides = {
  [S in Section]?: {
    [Key in keyof Preferences[S]]?: Preferences[S][Key] extends { value: infer V } ? V : never;
  };
};

const DEFAULT_VALUES: Record<Section, Record<string, unknown>> = {
  app: {
    colorScheme: "light",
    fadeThumbs: false,
    gradient: false,
    nativeFont: true,
    performanceProfile: "normal",
    theme: "native"
  },
  favorites: {
    allowedRatings: 7,
    columnCount: 5,
    downloadBatchSize: 500,
    downloadFilenameFormat: 3,
    drawerActiveSection: "settings",
    drawerOpen: false,
    excludeBlacklist: false,
    headerEnabled: true,
    hintsEnabled: true,
    infiniteScroll: false,
    layout: "column",
    postActionBar: "hover",
    postActionBarButtons: 1,
    resultsPerPage: 100,
    rowHeight: 7,
    settingsExpandedSections: {},
    sortAscending: false,
    sortKey: "default",
    tooltipEnabled: false,
    upscaleQuality: 1,
    upscaleThumbs: true
  },
  gallery: {
    autoplayActive: false,
    autoplayForward: true,
    autoplayImageDuration: 3_000,
    autoplayMinimumVideoDuration: 5_000,
    autoplayPaused: false,
    backgroundOpacity: 1,
    menuDockedLeft: true,
    menuEnabled: false,
    menuPinned: false,
    mobileEnabled: true,
    previewEnabled: false,
    themedBackground: false,
    tutorialSeen: false,
    videoMuted: false,
    videoVolume: 1
  },
  postOverlay: {
    enabled: false,
    mode: "tag"
  },
  postList: {
    columnCount: 5,
    enabled: false,
    favoriteIndicator: false,
    infiniteScroll: false,
    layout: "column",
    postActionBar: "hover",
    postActionBarButtons: 1,
    rowHeight: 7,
    settingsCollapsed: false,
    tooltipEnabled: false,
    upscaleQuality: 1,
    upscaleThumbs: true
  }
};

// A lone preference over its own memory store.
export function createPreference<T>(initial: T): Preference<T> {
  return new StoredPreference(new MemoryLocalKeyedValues(), "preference", initial);
}

// The app's preferences over a memory store, set to fixed test values so tests
// don't depend on the environment's defaults.
export function createPreferences(overrides: PreferenceOverrides = {}): Preferences {
  const preferences = createAppPreferences(selectPreferenceDefaults(createEnvironment()), new MemoryLocalKeyedValues());

  for (const [section, defaults] of Object.entries(DEFAULT_VALUES)) {
    const values = { ...defaults, ...overrides[section as Section] };
    const sectionPreferences = preferences[section as Section] as Record<string, Preference<unknown>>;

    for (const [name, value] of Object.entries(values)) {
      sectionPreferences[name].set(value);
    }
  }
  return preferences;
}
