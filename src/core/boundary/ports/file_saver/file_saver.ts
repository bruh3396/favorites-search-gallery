export interface FileSaver {
  save: (file: Blob, name: string) => void;
}
