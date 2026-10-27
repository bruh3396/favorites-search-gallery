import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import { StoredTree, createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { StoredValueStorage } from "@/core/utils/stored_value/stored_value_storage";

export interface SharedPreferences extends StoredTree<typeof APP_STORAGE_SCHEMA.preferences.shared> {
  readonly colorScheme: StoredValue<ColorScheme>;
}

export function createSharedPreferences(storage: StoredValueStorage, colorScheme: ColorScheme, hostPage: Pick<HostPage, "setColorScheme">): SharedPreferences {
  const { shared: storedSharedPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, storage, ["shared"]);
  return {
    ...storedSharedPreferences,
    colorScheme: new KeyedStoredValue({ key: "colorScheme", defaultValue: colorScheme }, {
      storage: { get: () => colorScheme, set: (_key, value) => hostPage.setColorScheme(value as ColorScheme) }
    })
  };
}
