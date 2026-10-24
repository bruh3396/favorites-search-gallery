export interface Clipboard {
  write: (text: string) => Promise<void>;
}
