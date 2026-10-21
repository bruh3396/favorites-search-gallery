import { describe, expect, test, vi } from "vitest";
import { listenForVideoEnd } from "@/core/features/lightbox/input/media_events";

describe("listenForVideoEnd", () => {
  test("tells autoplay when the shown video ends, and ignores other videos", () => {
    const root = document.createElement("div");
    const shown = document.createElement("video");
    const hidden = document.createElement("video");
    const showNextAfterVideo = vi.fn<() => void>();

    root.append(shown, hidden);
    listenForVideoEnd(root, { readShownMedia: () => shown, autoplay: { showNextAfterVideo } });
    hidden.dispatchEvent(new Event("ended"));
    shown.dispatchEvent(new Event("ended"));
    expect(showNextAfterVideo).toHaveBeenCalledOnce();
  });
});
