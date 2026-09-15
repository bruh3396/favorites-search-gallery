import { ON_FAVORITES_PAGE, ON_MOBILE_DEVICE } from "@/app/context/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { ImageRequest } from "@/features/gallery/types/image_request";

type BudgetedRequests = {
  accepted: ImageRequest[];
  rejected: ImageRequest[];
};

export class GalleryImageBudgeter {
  constructor(private readonly getPixelCount: (id: string) => number) {}

  public partition(thumbs: HTMLElement[]): BudgetedRequests {
    return this.partitionByLimit(thumbs.map(t => new ImageRequest(t)));
  }

  private megabytes(request: ImageRequest): number {
    return this.getPixelCount(request.id) / 220_000;
  }

  private partitionByLimit(requests: ImageRequest[]): BudgetedRequests {
    return ON_FAVORITES_PAGE && !ON_MOBILE_DEVICE ? this.partitionByMemory(requests) : this.partitionByCount(requests);
  }

  private partitionByMemory(requests: ImageRequest[]): BudgetedRequests {
    const accepted: ImageRequest[] = [];
    let totalMegabytes = 0;
    let cutoff = requests.length;

    for (let i = 0; i < requests.length; i += 1) {
      if (totalMegabytes >= GalleryConfig.imageMegabyteLimit &&
        accepted.length >= GalleryConfig.minimumCachedImageCount) {
        cutoff = i;
        break;
      }
      totalMegabytes += this.megabytes(requests[i]);
      accepted.push(requests[i]);
    }
    return { accepted, rejected: requests.slice(cutoff) };
  }

  private partitionByCount(requests: ImageRequest[]): BudgetedRequests {
    const cutoff = GalleryConfig.cachedImageCount;
    return { accepted: requests.slice(0, cutoff), rejected: requests.slice(cutoff) };
  }
}
