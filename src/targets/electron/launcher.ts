import { BrowserWindow, app, net, protocol } from "electron";
import path from "path";
import { pathToFileURL } from "url";

const APP_URL = "https://rule34.xxx/favorites-search-gallery/";
const APP_FILES: Record<string, string> = {
  "": "index.html",
  "app.js": "app.js"
};

function serveApp(): void {
  protocol.handle("https", request => {
    const file = request.url.startsWith(APP_URL) ? APP_FILES[new URL(request.url).pathname.slice(new URL(APP_URL).pathname.length)] : undefined;

    if (file === undefined) {
      return net.fetch(request, { bypassCustomProtocolHandlers: true });
    }
    return net.fetch(pathToFileURL(path.join(__dirname, file)).toString());
  });
}

function openWindow(): void {
  const window = new BrowserWindow({ width: 1_600, height: 1_000, backgroundColor: "#000000", autoHideMenuBar: true });

  window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  serveApp();
  openWindow();
});
app.on("window-all-closed", () => app.quit());
