import { FavoritesKeyBindingsRow } from "@/core/app/favorites/key_bindings/favorites_key_bindings_row";

export interface FavoritesKeyBindingsSection {
  readonly title: string;
  readonly rows: readonly FavoritesKeyBindingsRow[];
}
