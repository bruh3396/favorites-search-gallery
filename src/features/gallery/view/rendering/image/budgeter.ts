import { GalleryConfig } from "@/config/gallery_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { ON_FAVORITES_PAGE } from "@/lib/environment";

type BudgetedRequests = {
  accepted: ImageRequest[];
rejected: ImageRequest[];
};

let getPixelCount: (id: string) => number = () => 0;

export function setup(getPixelCountForId: (id: string) => number): void {
  getPixelCount = getPixelCountForId;
}

export function partition(thumbs: HTMLElement[]): BudgetedRequests {
  return partitionByLimit(thumbs.map(t => new ImageRequest(t)));
}

function megabytes(request: ImageRequest): number {
  return getPixelCount(request.id) / 220_000;
}

function partitionByLimit(requests: ImageRequest[]): BudgetedRequests {
  return ON_FAVORITES_PAGE ? partitionByMemory(requests) : partitionByCount(requests);
}

function partitionByMemory(requests: ImageRequest[]): BudgetedRequests {
  const accepted: ImageRequest[] = [];
  let totalMegabytes = 0;
  let cutoff = requests.length;

  for (let i = 0; i < requests.length; i += 1) {
    if (totalMegabytes >= GalleryConfig.imageMegabyteLimit &&
      accepted.length >= GalleryConfig.minimumCachedImageCount) {
      cutoff = i;
      break;
    }
    totalMegabytes += megabytes(requests[i]);
    accepted.push(requests[i]);
  }
  return { accepted, rejected: requests.slice(cutoff) };
}

function partitionByCount(requests: ImageRequest[]): BudgetedRequests {
  const cutoff = GalleryConfig.postListCachedImageCount;
  return { accepted: requests.slice(0, cutoff), rejected: requests.slice(cutoff) };
}
