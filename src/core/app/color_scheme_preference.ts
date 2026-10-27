import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Preference } from "@/core/utils/preference/preference";
import { StoredPreference } from "@/core/utils/preference/stored_preference";

export function createColorSchemePreference(colorScheme: ColorScheme, hostPage: HostPage): Preference<ColorScheme> {
  return new StoredPreference({ key: "colorScheme", defaultValue: colorScheme }, {
    storage: { get: () => colorScheme, set: (_key, value) => hostPage.setColorScheme(value as ColorScheme) }
  });
}
