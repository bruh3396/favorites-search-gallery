import { ColorScheme } from "@/core/boundary/environment";

export interface HostPage {
  readonly hasHeader: boolean;
  setHeaderVisible: (visible: boolean) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  reflectSearchPage: (pageIndex: number) => void;
  setPaginatorVisible: (visible: boolean) => void;
  lockViewport: () => void;
  lockScroll: () => void;
  unlockScroll: () => void;
}
