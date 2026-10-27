import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";

export class MemoryHostPage implements HostPage {
  public headerVisible = true;
  public colorScheme: ColorScheme = "light";
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

  public reflectSearchPage(pageIndex: number): void {
    this.searchPageIndex = pageIndex;
  }

  public setPaginatorVisible(visible: boolean): void {
    this.paginatorVisible = visible;
  }
}
