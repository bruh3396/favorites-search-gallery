import { AppMode } from "@/core/boundary/environment/app_mode";
import { ColorScheme } from "@/core/boundary/environment/color_scheme";

export interface HostEnvironment {
  readonly appMode: AppMode;
  readonly favoritesOwnerId: string;
  readonly ownsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
  readonly colorScheme: ColorScheme;
}
