import { describe, expect, test, vi } from "vitest";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/file_saver";

describe("BrowserFileSaver", () => {
  test("clicks a download link to the file under its name", () => {
    const link = { href: "", download: "", click: vi.fn() };
    const ownerDocument = { createElement: () => link } as unknown as Document;

    new BrowserFileSaver(ownerDocument).save(new Blob(["x"], { type: "image/png" }), "1.png");
    expect([link.download, link.href.startsWith("blob:"), link.click.mock.calls.length]).toEqual(["1.png", true, 1]);
  });
});
