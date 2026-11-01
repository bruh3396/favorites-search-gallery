import { ColorScheme } from "@/core/boundary/color_scheme";

export interface HostPage {
  readonly hasHeader: boolean;
  setHeaderVisible: (visible: boolean) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  reflectSearchPage: (pageIndex: number) => void;
  setPaginatorVisible: (visible: boolean) => void;
}
