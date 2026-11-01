export interface Tab<T> {
  readonly id: string;
  readonly value: T;
  readonly closable: boolean;
}

export interface TabOptions {
  readonly closable?: boolean;
}
