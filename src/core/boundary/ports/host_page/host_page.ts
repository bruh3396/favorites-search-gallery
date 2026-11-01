import { ColorScheme } from "@/core/boundary/color_scheme";
import { ThemeDefinition } from "@/core/ui/theme/theme";

export interface HostPage {
  readonly hasHeader: boolean;
  setHeaderVisible: (visible: boolean) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  setTheme: (themeDefinition: ThemeDefinition) => void;
  reflectSearchPage: (pageIndex: number) => void;
  setPaginatorVisible: (visible: boolean) => void;
}
