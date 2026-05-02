import { LocalStorage } from "./local_storage";
import { Store } from "../../../types/store";

export const Storage: Store = new LocalStorage();
