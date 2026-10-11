import { MockInstance, describe, expect, onTestFinished, test, vi } from "vitest";
import { MediaItem } from "@/core/domain/media/media";
import { VideoElement } from "@/core/ui/lightbox/stage/video/video_element";
import { VideoElementPool } from "@/core/ui/lightbox/stage/video/video_element_pool";
import { render } from "@/core/ui/h/h";

const FIRST: MediaItem = { id: "1", media: { kind: "video", locator: "videos/1.mp4" } };
const SECOND: MediaItem = { id: "2", media: { kind: "video", locator: "videos/2.mp4" } };
const THIRD: MediaItem = { id: "3", media: { kind: "video", locator: "videos/3.mp4" } };

interface Setup {
  pool: VideoElementPool;
  videos: readonly VideoElement[];
  assign: MockInstance<VideoElement["assign"]>;
  release: MockInstance<VideoElement["release"]>;
  activate: MockInstance<VideoElement["activate"]>;
  deactivate: MockInstance<VideoElement["deactivate"]>;
}

function getAssignments(pool: VideoElementPool): Map<string, VideoElement> {
  return Reflect.get(pool, "assignments") as Map<string, VideoElement>;
}

function setup(capacity: number, ownerDocument: Document = document): Setup {
  const assign = vi.spyOn(VideoElement.prototype, "assign").mockImplementation(() => undefined);
  const release = vi.spyOn(VideoElement.prototype, "release").mockImplementation(() => undefined);
  const activate = vi.spyOn(VideoElement.prototype, "activate").mockImplementation(() => undefined);
  const deactivate = vi.spyOn(VideoElement.prototype, "deactivate").mockImplementation(() => undefined);
  const resolveOriginalUrl = (): Promise<string> => Promise.resolve("https://original/video.mp4");
  const { result: pool } = render(ownerDocument, () => new VideoElementPool(capacity, resolveOriginalUrl));
  const videos = Reflect.get(pool, "elements") as readonly VideoElement[];

  onTestFinished(() => {
    vi.restoreAllMocks();
  });
  return { pool, videos, assign, release, activate, deactivate };
}

describe("VideoElementPool", () => {
  test("creates the requested number of mountable videos in the provided document", () => {
    const other = document.implementation.createHTMLDocument();
    const { pool, videos } = setup(3, other);
    const elements = pool.videoElements;

    expect(elements).toHaveLength(3);
    expect(new Set(elements).size).toBe(3);
    expect(elements).toEqual(videos.map(video => video.root));
    expect(elements.every(element => element.ownerDocument === other && element.controls && element.hidden)).toBe(true);
  });

  test("gives the current item priority, skips duplicate IDs, and stops at capacity", () => {
    const { pool, videos, assign, activate } = setup(2);
    const duplicate = { ...FIRST };

    pool.update(FIRST, [duplicate, SECOND, THIRD]);

    expect([...getAssignments(pool).keys()]).toEqual([FIRST.id, SECOND.id]);
    expect(getAssignments(pool).get(FIRST.id)).toBe(videos[0]);
    expect(getAssignments(pool).get(SECOND.id)).toBe(videos[1]);
    expect(assign.mock.calls).toEqual([[FIRST.media], [SECOND.media]]);
    expect(activate).toHaveBeenCalledOnce();
    expect(activate.mock.instances[0]).toBe(videos[0]);
  });

  test("fills available elements with neighbors when there is no current video", () => {
    const { pool, assign, activate } = setup(2);

    pool.update(undefined, [FIRST, SECOND, THIRD]);

    expect([...getAssignments(pool).keys()]).toEqual([FIRST.id, SECOND.id]);
    expect(assign.mock.calls).toEqual([[FIRST.media], [SECOND.media]]);
    expect(activate).not.toHaveBeenCalled();
  });

  test("keeps assignments and playback unchanged when the targets do not change", () => {
    const { pool, videos, assign, release, activate, deactivate } = setup(2);

    pool.update(FIRST, [SECOND]);
    pool.update(FIRST, [SECOND]);

    expect([...getAssignments(pool).values()]).toEqual(videos);
    expect(assign).toHaveBeenCalledTimes(2);
    expect(activate).toHaveBeenCalledOnce();
    expect(deactivate).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  test("promotes an assigned candidate and pauses the former current video", () => {
    const { pool, videos, assign, release, activate, deactivate } = setup(2);

    pool.update(FIRST, [SECOND]);
    pool.update(SECOND, [FIRST]);

    expect(getAssignments(pool).get(FIRST.id)).toBe(videos[0]);
    expect(getAssignments(pool).get(SECOND.id)).toBe(videos[1]);
    expect(deactivate).toHaveBeenCalledOnce();
    expect(deactivate.mock.instances[0]).toBe(videos[0]);
    expect(activate.mock.instances).toEqual([videos[0], videos[1]]);
    expect(assign).toHaveBeenCalledTimes(2);
    expect(release).not.toHaveBeenCalled();
  });

  test("deactivates and releases an old video before reusing its element", () => {
    const { pool, videos, assign, release, activate, deactivate } = setup(1);

    pool.update(FIRST, []);
    pool.update(SECOND, []);

    expect(deactivate).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(deactivate.mock.instances[0]).toBe(videos[0]);
    expect(release.mock.instances[0]).toBe(videos[0]);
    expect(getAssignments(pool).get(SECOND.id)).toBe(videos[0]);
    expect(assign.mock.calls).toEqual([[FIRST.media], [SECOND.media]]);
    expect(activate).toHaveBeenCalledTimes(2);
  });

  test("deactivates a former current video while retaining it as a candidate", () => {
    const { pool, assign, release, activate, deactivate } = setup(2);

    pool.update(FIRST, [SECOND]);
    pool.update(undefined, [FIRST, SECOND]);

    expect([...getAssignments(pool).keys()]).toEqual([FIRST.id, SECOND.id]);
    expect(deactivate).toHaveBeenCalledOnce();
    expect(activate).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledTimes(2);
    expect(release).not.toHaveBeenCalled();
  });

  test("releases every assignment when there are no targets", () => {
    const { pool, videos, release, deactivate } = setup(2);

    pool.update(FIRST, [SECOND]);
    pool.update(undefined, []);

    expect(deactivate).toHaveBeenCalledOnce();
    expect(release.mock.instances).toEqual(videos);
    expect(getAssignments(pool).size).toBe(0);
  });

  test("releases assigned and free elements on disposal", () => {
    const { pool, videos, release } = setup(2);

    pool.update(FIRST, []);
    pool.dispose();

    expect(release.mock.instances).toEqual(videos);
    expect(getAssignments(pool).size).toBe(0);
    expect(Reflect.get(pool, "activeElement")).toBeUndefined();
  });

  test("leaves a current item unassigned when the pool has no elements", () => {
    const { pool, assign, activate } = setup(0);

    pool.update(FIRST, []);

    expect(pool.videoElements).toEqual([]);
    expect(getAssignments(pool).size).toBe(0);
    expect(assign).not.toHaveBeenCalled();
    expect(activate).not.toHaveBeenCalled();
  });
});
