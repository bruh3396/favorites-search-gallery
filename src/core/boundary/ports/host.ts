import { AppMode } from "@/core/boundary/environment";

export interface Host {
  takeOver: (mode: AppMode) => void;
}
