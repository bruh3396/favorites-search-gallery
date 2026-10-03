import { RemotePages } from "@/core/boundary/ports/remote_pages";

// In-page anchors, so following one never leaves the page.
export class MemoryRemotePages implements RemotePages {
  public postUrl(id: string): string {
    return `#post-${id}`;
  }

  public searchUrl(query: string): string {
    return `#search-${encodeURIComponent(query)}`;
  }
}
