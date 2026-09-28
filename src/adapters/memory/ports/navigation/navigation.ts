import { MediaItem } from "@/types/media";
import { Navigation } from "@/core/boundary/ports/navigation";

// Records where the app asked to go instead of leaving the page.
export class MemoryNavigation implements Navigation {
  public readonly opened: string[] = [];

  public postUrl(id: string): string {
    return `#post-${id}`;
  }

  public openPost(id: string): void {
    this.opened.push(this.postUrl(id));
  }

  public openMedia(item: MediaItem): void {
    this.opened.push(`#media-${item.id}`);
  }

  public openSearch(query: string): void {
    this.opened.push(`#search-${encodeURIComponent(query)}`);
  }
}
