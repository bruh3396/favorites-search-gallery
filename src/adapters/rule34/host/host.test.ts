import { describe, expect, test, vi } from "vitest";
import { AppMode } from "@/core/boundary/environment";
import { Rule34Host } from "@/adapters/rule34/host/host";

function takeOver(mode: AppMode): { clearPage: ReturnType<typeof vi.fn>; holdPostPages: ReturnType<typeof vi.fn> } {
  const clearPage = vi.fn();
  const holdPostPages = vi.fn();

  new Rule34Host(clearPage, holdPostPages).takeOver(mode);
  return { clearPage, holdPostPages };
}

describe("Rule34Host", () => {
  test("clears the favorites page and holds post page fetches", () => {
    const { clearPage, holdPostPages } = takeOver("favorites");

    expect(clearPage).toHaveBeenCalledOnce();
    expect(holdPostPages).toHaveBeenCalledOnce();
  });

  test("leaves the post list page alone", () => {
    const { clearPage, holdPostPages } = takeOver("posts");

    expect(clearPage).not.toHaveBeenCalled();
    expect(holdPostPages).not.toHaveBeenCalled();
  });
});
