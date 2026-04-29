import { LocalStorage } from "./local_storage";
import { Store } from "./store";

export const Storage: Store = new LocalStorage();
