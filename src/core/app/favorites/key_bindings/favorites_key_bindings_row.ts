import { Readable } from "@/core/utils/reactive/signal";

export interface FavoritesKeyBindingsRow {
  readonly label: string;
  readonly keys: Readable<readonly string[]>;
  findKeyOwnerLabel: (key: string) => string | undefined;
  onKeyChange: (keyIndex: number, key: string) => void;
  onKeyRemove: (keyIndex: number) => void;
}
