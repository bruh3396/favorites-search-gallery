import { runSyntax } from "#architecture/eslint/testing/syntax_tester.mjs";

const CORE_FILES = ["core/utils/utils.ts", "features/favorites/model/model.ts", "features/favorites/features/snippets/model/store.ts", "core/features/tooltip/tooltip.ts"];

function casesFor(files, code) {
  return files.map(file => [file, code]);
}

runSyntax("rule23", {
  valid: [
    ["adapters/rule34/client/client.ts", "fetch(url);"],
    ["features/favorites/view/renderer.ts", "fetch(url);"],
    ["core/utils/utils.test.ts", "fetch(url);"],
    ["core/utils/utils.ts", "remotePosts.fetch(url);"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "fetch(url);"),
    ["core/utils/utils.ts", "new XMLHttpRequest();"],
    ["core/utils/utils.ts", "window.fetch(url);"],
    ["core/utils/utils.ts", "globalThis.fetch(url);"]
  ]
});

runSyntax("rule24", {
  valid: [["adapters/rule34/client/client.ts", "localStorage.getItem(key);"]],
  invalid: [
    ...casesFor(CORE_FILES, "localStorage.getItem(key);"),
    ["core/utils/utils.ts", "indexedDB.open(name);"],
    ["core/utils/utils.ts", "window.sessionStorage.clear();"]
  ]
});

runSyntax("rule25", {
  valid: [
    ["adapters/rule34/client/client.ts", "setTimeout(run, 1);"],
    ["core/utils/utils.ts", "scheduler.schedule(run, 1);"],
    ["core/utils/utils.ts", "new Date(timestamp);"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "setTimeout(run, 1);"),
    ["core/utils/utils.ts", "requestAnimationFrame(run);"],
    ["core/utils/utils.ts", "performance.now();"],
    ["core/utils/utils.ts", "Date.now();"],
    ["core/utils/utils.ts", "new Date();"]
  ]
});

runSyntax("rule26", {
  valid: [
    ["adapters/rule34/client/client.ts", "location.href;"],
    ["core/utils/utils.ts", "function read(location: string): string { return location; }"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "location.href;"),
    ["core/utils/utils.ts", "navigator.userAgent;"],
    ["core/utils/utils.ts", "history.back();"],
    ["core/utils/utils.ts", "window.location.reload();"]
  ]
});

runSyntax("rule27", {
  valid: [
    ["adapters/browser/client/client.ts", "Math.random();"],
    ["core/utils/utils.ts", "random.next();"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "Math.random();"),
    ["core/utils/utils.ts", "crypto.randomUUID();"]
  ]
});

runSyntax("rule28", {
  valid: [["features/favorites/control/control.ts", "confirm(text);"]],
  invalid: [
    ...casesFor(CORE_FILES, "confirm(text);"),
    ["core/utils/utils.ts", "alert(text);"],
    ["core/utils/utils.ts", "window.prompt(text);"]
  ]
});

runSyntax("rule29", {
  valid: [
    ["adapters/browser/client/client.ts", "URL.createObjectURL(blob);"],
    ["core/utils/utils.ts", "new URL(href);"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "URL.createObjectURL(blob);"),
    ["core/utils/utils.ts", "new FileReader();"],
    ["core/utils/utils.ts", "showSaveFilePicker();"],
    ["core/utils/utils.ts", "anchor.download = name;"]
  ]
});

runSyntax("rule30", {
  valid: [
    ["targets/target.ts", "GM_xmlhttpRequest(request);"],
    ["adapters/rule34/client/client.ts", "GM_xmlhttpRequest(request);"],
    ["lib/lib.ts", "declare function GM_xmlhttpRequest(request: object): void;"],
    ["lib/lib.ts", "declare const GM_info: object;"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "GM_xmlhttpRequest(request);"),
    ["lib/lib.ts", "GM_setValue(key, value);"],
    ["features/favorites/view/renderer.ts", "GM.getValue(key);"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "unsafeWindow.document;"]
  ]
});

runSyntax("rule31", {
  valid: [["adapters/rule34/client/client.ts", "window.open(url);"]],
  invalid: [
    ...casesFor(CORE_FILES, "window.open(url);"),
    ["core/utils/utils.ts", "open(url);"]
  ]
});

runSyntax("rule33", {
  valid: [
    ["features/favorites/view/renderer.ts", "document.createElement(tag);"],
    ["features/favorites/control/control.ts", "window.addEventListener(type, listener);"],
    ["features/favorites/features/features.ts", "window.addEventListener(type, listener);"],
    ["features/favorites/flows/search.test.ts", "document.body;"]
  ],
  invalid: [
    ["features/favorites/flows/search.ts", "document.createElement(tag);"],
    ["features/favorites/types/types.ts", "window.innerWidth;"],
    ["features/favorites/favorites.ts", "document.body;"],
    ["features/favorites/features/snippets/snippets.ts", "document.body;"],
    ["features/favorites/features/snippets/flows/flow.ts", "globalThis.document;"]
  ]
});

runSyntax("rule35", {
  valid: [
    ["features/favorites/view/renderer.ts", "document.querySelector(selector);"],
    ["adapters/rule34/client/client.ts", "document.body;"],
    ["core/utils/utils.ts", "root.ownerDocument.createElement(tag);"],
    ["core/utils/utils.ts", "root.querySelector(selector);"]
  ],
  invalid: [
    ...casesFor(CORE_FILES, "document.createElement(tag);"),
    ["core/utils/utils.ts", "document.body.appendChild(node);"],
    ["core/utils/utils.ts", "window.addEventListener(type, listener);"],
    ["core/utils/utils.ts", "globalThis.document;"],
    ["core/utils/utils.ts", "root.ownerDocument.defaultView;"]
  ]
});
