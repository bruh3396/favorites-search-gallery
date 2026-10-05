import { BudgetedRequests, ImageBudgeter } from "@/features/gallery/types/types";
import { Favorite } from "@/types/favorite";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { PostMedia } from "@/core/domain/post/post";

const PIXELS_PER_MEGABYTE = 220_000;

export abstract class GalleryAbstractImageBudgeter implements ImageBudgeter {
  public partition(items: PostMedia[]): BudgetedRequests {
    return this.partitionByLimit(items.map(item => new ImageRequest(item)));
  }

  protected abstract partitionByLimit(requests: ImageRequest[]): BudgetedRequests;
}

export class GalleryLimitImageBudgeter extends GalleryAbstractImageBudgeter {
  constructor(private readonly limit: number) {
    super();
  }

  protected partitionByLimit(requests: ImageRequest[]): BudgetedRequests {
    return { accepted: requests.slice(0, this.limit), rejected: requests.slice(this.limit) };
  }
}

export interface GalleryMemoryImageBudgeterConfiguration {
  megabyteLimit: number;
  minimumCount: number;
}

export class GalleryMemoryImageBudgeter extends GalleryAbstractImageBudgeter {
  private readonly megabyteLimit: number;
  private readonly minimumCount: number;

  constructor(
    { megabyteLimit, minimumCount }: GalleryMemoryImageBudgeterConfiguration,
    private readonly getFavorite: (id: string) => Pick<Favorite, "getMetric"> | undefined
  ) {
    super();
    this.megabyteLimit = megabyteLimit;
    this.minimumCount = minimumCount;
  }

  protected partitionByLimit(requests: ImageRequest[]): BudgetedRequests {
    const accepted: ImageRequest[] = [];
    let totalMegabytes = 0;
    let cutoff = requests.length;

    for (let i = 0; i < requests.length; i += 1) {
      if (totalMegabytes >= this.megabyteLimit &&
        accepted.length >= this.minimumCount) {
        cutoff = i;
        break;
      }
      totalMegabytes += this.megabytes(requests[i]);
      accepted.push(requests[i]);
    }
    return { accepted, rejected: requests.slice(cutoff) };
  }

  private megabytes(request: ImageRequest): number {
    const favorite = this.getFavorite(request.id);
    return favorite === undefined ? 0 : favorite.getMetric("width") * favorite.getMetric("height") / PIXELS_PER_MEGABYTE;
  }
}
