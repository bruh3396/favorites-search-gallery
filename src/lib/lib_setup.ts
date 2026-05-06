import { setupEvents } from "./communication/dom_event_bridge";
import { setupExtensions } from "./media/media_extension_resolver";
import { setupServer } from "./remote/api/server_client";
import { setupShell } from "./shell";
import { setupStyles } from "./ui/style";

export function setupLibrary(): void {
  setupServer();
  setupEvents();
  setupExtensions();
  setupStyles();
  setupShell();
}
