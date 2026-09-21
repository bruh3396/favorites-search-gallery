import * as GalleryFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Environment } from "@/app/context/environment";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";

const queueWait = vi.fn<() => Promise<boolean>>(() => Promise.resolve(true));
const queueReset = vi.fn();

vi.mock("@/lib/async/rate_limiting", () => ({
  ThrottleQueue: class {
    public wait = queueWait;
    public reset = queueReset;
  }
}));

vi.mock("@/features/gallery/view/rendering/image/fetcher", () => ({
  fetchBitmap: vi.fn()
}));

const fetchBitmap = vi.mocked(GalleryFetcher.fetchBitmap);

class TestUpscaler extends GalleryAbstractUpscaler {
  public readonly painted: string[] = [];
  public readonly evicted: string[] = [];

  protected paint(r: ImageRequest): void {
    this.painted.push(r.id);
  }

  protected evict(id: string): void {
    this.evicted.push(id);
  }
}

class BitmaplessUpscaler extends TestUpscaler {
  protected override readonly needsBitmapForPaint = false;
}

const idsOnPage = new Set<string>();
let contentThumbIds: string[] = [];

function fakeShell(): Shell {
  return {
    findThumb: (id: string) => (idsOnPage.has(id) ? ({ id } as HTMLElement) : null),
    getContentThumbs: () => contentThumbIds.map(id => ({ id } as HTMLElement))
  } as unknown as Shell;
}

let isUpscalingEnabled = true;

function fakePreferences(): Preferences {
  const preference = {
    get value(): boolean {
      return isUpscalingEnabled;
    }
  };
  return {
    favorites: { upscaleThumbs: preference },
    postList: { upscaleThumbs: preference }
  } as unknown as Preferences;
}

function fakeEnvironment(): Environment {
  return { onPostListPage: false, usingFirefox: false } as unknown as Environment;
}

const completedIds = new Set<string>();

function request(id: string): ImageRequest {
  idsOnPage.add(id);
  return {
    id,
    isHighRes: true,
    get hasCompleted(): boolean {
      return completedIds.has(id);
    },
    get isIncomplete(): boolean {
      return !completedIds.has(id);
    }
  } as unknown as ImageRequest;
}

function completedRequest(id: string): ImageRequest {
  completedIds.add(id);
  return request(id);
}

function incompleteRequest(id: string): ImageRequest {
  return request(id);
}

function createTestUpscaler(): TestUpscaler {
  return new TestUpscaler(fakeEnvironment(), fakePreferences(), fakeShell());
}

async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.clearAllMocks();
  queueWait.mockImplementation(() => Promise.resolve(true));
  idsOnPage.clear();
  completedIds.clear();
  contentThumbIds = [];
  isUpscalingEnabled = true;
  fetchBitmap.mockImplementation((req: ImageRequest) => {
    completedIds.add(req.id);
    return Promise.resolve(true);
  });
});

describe("GalleryAbstractUpscaler", () => {
  describe("tryPainting", () => {
    test("paints a completed request that is on the page", () => {
      const upscaler = createTestUpscaler();

      upscaler.tryPainting(completedRequest("a"));

      expect(upscaler.painted).toEqual(["a"]);
    });

    test("does not paint an incomplete request when the backend needs a bitmap", () => {
      const upscaler = createTestUpscaler();

      upscaler.tryPainting(incompleteRequest("a"));

      expect(upscaler.painted).toEqual([]);
    });

    test("paints an incomplete request when the backend does not need a bitmap", () => {
      const upscaler = new BitmaplessUpscaler(fakeEnvironment(), fakePreferences(), fakeShell());

      upscaler.tryPainting(incompleteRequest("a"));

      expect(upscaler.painted).toEqual(["a"]);
    });

    test("does not paint when upscaling is disabled", () => {
      isUpscalingEnabled = false;
      const upscaler = createTestUpscaler();

      upscaler.tryPainting(completedRequest("a"));

      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint while paused, and paints again after resume", () => {
      const upscaler = createTestUpscaler();

      upscaler.pause();

      upscaler.tryPainting(completedRequest("a"));
      expect(upscaler.painted).toEqual([]);

      upscaler.resume();
      upscaler.tryPainting(completedRequest("b"));
      expect(upscaler.painted).toEqual(["b"]);
    });

    test("does not paint a request whose thumb has left the page", () => {
      const upscaler = createTestUpscaler();
      const req = completedRequest("a");

      idsOnPage.delete("a");

      upscaler.tryPainting(req);

      expect(upscaler.painted).toEqual([]);
    });

    test("does not repaint an already-painted request", () => {
      const upscaler = createTestUpscaler();
      const req = completedRequest("a");

      upscaler.tryPainting(req);
      upscaler.tryPainting(req);

      expect(upscaler.painted).toEqual(["a"]);
    });
  });

  describe("repaintAll", () => {
    test("paints every eligible completed request", () => {
      const upscaler = createTestUpscaler();

      upscaler.repaintAll([completedRequest("a"), completedRequest("b")]);

      expect(upscaler.painted).toEqual(["a", "b"]);
    });

    test("paints nothing when disabled", () => {
      isUpscalingEnabled = false;
      const upscaler = createTestUpscaler();

      upscaler.repaintAll([completedRequest("a")]);

      expect(upscaler.painted).toEqual([]);
    });
  });

  describe("fetchThenPaintAll", () => {
    test("fetches then paints an incomplete request", async() => {
      const upscaler = createTestUpscaler();

      upscaler.fetchThenPaintAll([incompleteRequest("a")]);
      await flush();

      expect(fetchBitmap).toHaveBeenCalledOnce();
      expect(upscaler.painted).toEqual(["a"]);
    });

    test("does not fetch on the main thread when the backend does not need a bitmap", async() => {
      const upscaler = new BitmaplessUpscaler(fakeEnvironment(), fakePreferences(), fakeShell());

      upscaler.fetchThenPaintAll([incompleteRequest("a")]);
      await flush();

      expect(fetchBitmap).not.toHaveBeenCalled();
      expect(upscaler.painted).toEqual(["a"]);
    });

    test("does not paint when the main-thread fetch fails", async() => {
      fetchBitmap.mockResolvedValue(false);
      const upscaler = createTestUpscaler();

      upscaler.fetchThenPaintAll([incompleteRequest("a")]);
      await flush();

      expect(upscaler.painted).toEqual([]);
    });

    test("does not fetch when the queue drain was cancelled", async() => {
      queueWait.mockImplementation(() => Promise.resolve(false));
      const upscaler = createTestUpscaler();

      upscaler.fetchThenPaintAll([incompleteRequest("a")]);
      await flush();

      expect(fetchBitmap).not.toHaveBeenCalled();
      expect(upscaler.painted).toEqual([]);
    });

    test("does not fetch a request that left the page during the throttle wait", async() => {
      queueWait.mockImplementation(() => {
        idsOnPage.delete("a");
        return Promise.resolve(true);
      });
      const upscaler = createTestUpscaler();

      upscaler.fetchThenPaintAll([incompleteRequest("a")]);
      await flush();

      expect(fetchBitmap).not.toHaveBeenCalled();
      expect(upscaler.painted).toEqual([]);
    });

    test("does nothing when disabled", async() => {
      isUpscalingEnabled = false;
      const upscaler = createTestUpscaler();

      upscaler.fetchThenPaintAll([incompleteRequest("a")]);
      await flush();

      expect(fetchBitmap).not.toHaveBeenCalled();
      expect(upscaler.painted).toEqual([]);
    });
  });

  describe("erasing", () => {
    test("eraseAll evicts every painted id", () => {
      const upscaler = createTestUpscaler();

      upscaler.tryPainting(completedRequest("a"));
      upscaler.tryPainting(completedRequest("b"));

      upscaler.eraseAll();

      expect(upscaler.evicted).toEqual(["a", "b"]);
    });

    test("eraseAll lets a request be painted again afterwards", () => {
      const upscaler = createTestUpscaler();
      const req = completedRequest("a");

      upscaler.tryPainting(req);

      upscaler.eraseAll();
      upscaler.tryPainting(req);

      expect(upscaler.painted).toEqual(["a", "a"]);
    });

    test("eraseDetached evicts only ids no longer on the page", () => {
      const upscaler = createTestUpscaler();

      upscaler.tryPainting(completedRequest("a"));
      upscaler.tryPainting(completedRequest("b"));
      idsOnPage.delete("a");

      upscaler.eraseDetached();

      expect(upscaler.evicted).toEqual(["a"]);
    });
  });

  describe("capacity", () => {
    test("evicts the oldest off-screen id once the cap is exceeded", () => {
      const upscaler = createTestUpscaler();
      const total = GalleryUpscaleConfig.maxUpscaledThumbs + 1;

      contentThumbIds = [String(total - 1)];

      for (let i = 0; i < total; i += 1) {
        upscaler.tryPainting(completedRequest(String(i)));
      }

      expect(upscaler.painted).toHaveLength(total);
      expect(upscaler.evicted).toEqual(["0"]);
    });
  });
});
