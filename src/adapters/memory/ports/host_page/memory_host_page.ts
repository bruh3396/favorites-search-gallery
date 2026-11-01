import { ColorScheme } from "@/core/boundary/color_scheme";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { ThemeDefinition } from "@/core/ui/theme/theme";

export class MemoryHostPage implements HostPage {
  public headerVisible = true;
  public colorScheme: ColorScheme = "light";
  public themeDefinition: ThemeDefinition | null = null;
  public searchPageIndex: number | null = null;
  public paginatorVisible = true;

  constructor(public readonly hasHeader = false) { }

  public setHeaderVisible(visible: boolean): void {
    if (this.hasHeader) {
      this.headerVisible = visible;
    }
  }

  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
  }

  public setTheme(themeDefinition: ThemeDefinition): void {
    this.themeDefinition = themeDefinition;
  }

  public reflectSearchPage(pageIndex: number): void {
    this.searchPageIndex = pageIndex;
  }

  public setPaginatorVisible(visible: boolean): void {
    this.paginatorVisible = visible;
  }
}
