import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { StoredTree } from "@/core/utils/storage/stored_tree";

export type AppPreferences = StoredTree<typeof APP_STORAGE_SCHEMA.preferences>;
