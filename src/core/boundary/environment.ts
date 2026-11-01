import { AppMode } from "@/core/boundary/app_mode";
import { CanvasBudget } from "@/core/boundary/canvas_budget";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { Device } from "@/core/boundary/device";
import { Pointer } from "@/core/boundary/pointer";

export interface HostEnvironment {
  readonly appMode: AppMode;
  readonly favoritesOwnerId: string;
  readonly ownsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
  readonly colorScheme: ColorScheme;
}

export interface RuntimeEnvironment {
  readonly device: Device;
  readonly pointer: Pointer;
  readonly canvasBudget: CanvasBudget;
}

export interface Environment extends HostEnvironment, RuntimeEnvironment {
  readonly version: string;
}
