import * as SnippetActions from "@/features/favorites/features/snippets/control/actions";
import { afterEach, describe, expect, test, vi } from "vitest";
import { flushMicrotasks } from "@/testing/async";

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each([
  ["exportButton", SnippetActions.exportButton, "Export"],
  ["deleteAllButton", SnippetActions.deleteAllButton, "Delete all"]
])("%s", (_, build, tooltip) => {
  test("is a button with a tooltip below it", () => {
    const button = build((): void => { }) as HTMLButtonElement;

    expect(button.type).toBe("button");
    expect(button.dataset.tooltip).toBe(tooltip);
    expect(button.dataset.tooltipPos).toBe("below");
    expect(button.querySelector("svg")).not.toBeNull();
  });

  test("fires its callback when clicked", () => {
    const clicks: string[] = [];

    build((): number => clicks.push("clicked")).click();
    expect(clicks).toEqual(["clicked"]);
  });
});

describe("importButton", () => {
  test("is a button with a tooltip below it", () => {
    const button = SnippetActions.importButton((): void => { }) as HTMLButtonElement;

    expect(button.type).toBe("button");
    expect(button.dataset.tooltip).toBe("Import");
    expect(button.dataset.tooltipPos).toBe("below");
  });

  test("passes the chosen json file's contents to its callback", async() => {
    const imported: string[] = [];
    const accepted: string[] = [];

    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function choose(this: HTMLInputElement): void {
      accepted.push(this.accept);
      Object.defineProperty(this, "files", { value: [new File(["[]"], "snippets.json")] });
      this.dispatchEvent(new Event("change"));
    });
    SnippetActions.importButton((contents): number => imported.push(contents)).click();
    await flushMicrotasks();
    expect(accepted).toEqual(["application/json,.json"]);
    expect(imported).toEqual(["[]"]);
  });
});
