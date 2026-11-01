import { StoredTree, createStoredTree } from "@/core/utils/storage/stored_tree";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";

export type SharedPreferences = StoredTree<typeof APP_STORAGE_SCHEMA.preferences.shared> & {
  readonly colorScheme: StoredValue<ColorScheme>;
};

export function createSharedPreferences(
  storedValueStorage: StoredValueStorage,
  colorScheme: ColorScheme,
  hostPage: Pick<HostPage, "setColorScheme">
): SharedPreferences {
  const { shared: sharedPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, storedValueStorage, ["shared"]);
  return {
    ...sharedPreferences,
    colorScheme: new KeyedStoredValue({ key: "colorScheme", defaultValue: colorScheme }, {
      storedValueStorage: { get: () => colorScheme, set: (_key, value) => hostPage.setColorScheme(value as ColorScheme) }
    })
  };
}
