import { describe, expect, test } from "vitest";
import { flushMicrotasks } from "@/testing/async";
import { waitForThumbsToLoadInContainer } from "@/lib/ui/thumb/loading";

function createThumb({ loading = false } = {}): { thumb: HTMLElement; image: HTMLImageElement } {
  const thumb = document.createElement("div");
  const image = document.createElement("img");

  thumb.className = "post";
  thumb.append(image);

  if (loading) {
    thumb.dataset.loading = "";
  }
  return { thumb, image };
}

async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;

  void promise.then(() => {
    settled = true;
  });
  await flushMicrotasks();
  return settled;
}

describe("waitForThumbsToLoadInContainer", () => {
  test("does not wait on thumbs with nothing to load", async() => {
    const container = document.createElement("div");

    container.append(createThumb().thumb);
    expect(await isSettled(waitForThumbsToLoadInContainer(container))).toBe(true);
  });

  test("waits on a loading thumb whose source is not set yet", async() => {
    const container = document.createElement("div");
    const { thumb, image } = createThumb({ loading: true });

    container.append(thumb);
    const waiting = waitForThumbsToLoadInContainer(container);

    expect(await isSettled(waiting)).toBe(false);
    image.dispatchEvent(new Event("load"));
    expect(await isSettled(waiting)).toBe(true);
  });
});
