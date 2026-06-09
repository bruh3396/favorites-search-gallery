import { insertStyle } from "@/utils/dom/injector";

export function toggleHeader(value: boolean): void {
  insertStyle(`#header {display: ${value ? "block" : "none"}}`, "header");
}
