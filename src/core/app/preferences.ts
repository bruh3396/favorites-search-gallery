import { GRID_LAYOUTS, GridLayout } from "@/core/ui/post_grid/tiler";
import { Preference, PreferenceStorage, StoredPreference } from "@/core/utils/reactive/preference";
import { createFieldsCodec, createGuardedCodec } from "@/core/utils/codec/codec";
import { isBoolean, oneOf } from "@/core/utils/guards/guards";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";

const DEFAULT_PAGINATION_SETTINGS: PaginationSettings = { size: 50, infiniteScroll: false };
const PAGINATION_SETTINGS_CODEC = createFieldsCodec<PaginationSettings>({ size: isPageSize, infiniteScroll: isBoolean });

export interface PostGridPreferences {
  readonly layout: Preference<GridLayout>;
  readonly size: Preference<number>;
  readonly upscale: Preference<boolean>;
}

export function createPostGridSettings(storage: PreferenceStorage): PostGridPreferences {
  return {
    layout: new StoredPreference<GridLayout>({ key: "postGridLayout", defaultValue: "column" }, { storage, codec: createGuardedCodec(oneOf(GRID_LAYOUTS)) }),
    size: new StoredPreference({ key: "postGridSize", defaultValue: 6 }, { storage }),
    upscale: new StoredPreference({ key: "postGridUpscale", defaultValue: true }, { storage })
  };
}

export function createPaginationSettings(storage: PreferenceStorage): Preference<PaginationSettings> {
  return new StoredPreference(
    { key: "favoritesPagination", defaultValue: DEFAULT_PAGINATION_SETTINGS },
    {
      storage,
      codec: {
        decode: (stored): PaginationSettings => ({ ...DEFAULT_PAGINATION_SETTINGS, ...PAGINATION_SETTINGS_CODEC.decode(stored) }),
        encode: (settings): unknown => PAGINATION_SETTINGS_CODEC.encode(settings)
      }
    }
  );
}
export function isPageSize(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 1;
}
