import { Navigation } from "@/core/boundary/ports/navigation";

// Records where the app asked to go instead of leaving the page.
export class MemoryNavigation implements Navigation {
  public readonly opened: string[] = [];

  public postUrl(id: string): string {
    return `#post-${id}`;
  }

  public openInNewTab(url: string): void {
    this.opened.push(url);
  }

  public openSearchInNewTab(query: string): void {
    this.opened.push(`#search-${encodeURIComponent(query)}`);
  }
}
