export interface Links {
  postUrl: (id: string) => string;
  openInNewTab: (url: string) => void;
  openSearchInNewTab: (query: string) => void;
}
