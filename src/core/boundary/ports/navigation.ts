export interface Navigation {
  postUrl: (id: string) => string;
  openUrl: (url: string) => void;
  openSearch: (query: string) => void;
}
