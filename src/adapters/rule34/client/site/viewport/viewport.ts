const LOCKED_VIEWPORT = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

export function lockViewport(): void {
  const existing = document.querySelector<HTMLMetaElement>("meta[name=viewport]");
  const meta = existing ?? document.createElement("meta");

  meta.name = "viewport";
  meta.content = LOCKED_VIEWPORT;

  if (existing === null) {
    document.head.appendChild(meta);
  }
}
