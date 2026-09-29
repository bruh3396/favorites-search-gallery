export interface Navigation {
  postUrl: (id: string) => string;
  openInNewTab: (url: string) => void;
  openSearchInNewTab: (query: string) => void;
}
