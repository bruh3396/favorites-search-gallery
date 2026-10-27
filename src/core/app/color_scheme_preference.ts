import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";

export function createColorSchemePreference(colorScheme: ColorScheme, hostPage: HostPage): StoredValue<ColorScheme> {
  return new KeyedStoredValue({ key: "colorScheme", defaultValue: colorScheme }, {
    storage: { get: () => colorScheme, set: (_key, value) => hostPage.setColorScheme(value as ColorScheme) }
  });
}
