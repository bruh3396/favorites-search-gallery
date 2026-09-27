import { Emitter } from "@/lib/event/emitter";
import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";

export type PreferenceOverrides = {
  [Section in keyof Preferences]?: {
    [Key in keyof Preferences[Section]]?: Preferences[Section][Key] extends { value: infer V } ? V : never;
  };
};

type PreferenceValues = Record<string, Record<string, unknown>>;

const DEFAULT_VALUES: PreferenceValues = {
  app: {
    darkMode: false,
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

// An in-memory preference: set() writes and notifies listeners, like the real
// one, without touching storage.
export function createPreference<T>(initial: T): Preference<T> {
  const emitter = new Emitter<T>();
  let current = initial;
  return {
    get value(): T {
      return current;
    },
    set(next: T): void {
      current = next;
      emitter.emit(next);
    },
    on(listener: (value: T) => void): void {
      emitter.on(listener);
    }
  } as unknown as Preference<T>;
}

export function createPreferences(overrides: PreferenceOverrides = {}): Preferences {
  const values = overrides as PreferenceValues;
  return Object.fromEntries(Object.entries(DEFAULT_VALUES).map(([section, defaults]) => [
    section,
    Object.fromEntries(Object.entries({ ...defaults, ...values[section] }).map(([key, value]) => [key, createPreference(value)]))
  ])) as unknown as Preferences;
}
