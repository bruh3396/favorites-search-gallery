import { StoredTree } from "@/core/utils/storage/stored_tree";

export interface StoredMap<S> {
  get: (key: string) => StoredTree<S>;
}
