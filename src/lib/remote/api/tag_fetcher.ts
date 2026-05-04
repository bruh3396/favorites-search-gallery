import { CoalescingExecutor } from "../../core/concurrency/coalescing_executor";
import { TAG_API_URL } from "../url/api_url_builder";
import { Tag } from "../../../types/api";
import { postToServer } from "./server_client";
import { tagLimiter } from "../http/rate_limiter";

type TagResolver = { resolve: (tag: Tag) => void; reject: (reason: unknown) => void };

const TAG_BATCH_SIZE = 50;
const TAG_FLUSH_DELAY = 1250;

const pendingTags = new Map<string, TagResolver>();
const tagBatchExecutor = new CoalescingExecutor<string>(TAG_BATCH_SIZE, TAG_FLUSH_DELAY, flushTagBatch);

async function fetchTagBatch(tagNames: string[]): Promise<Record<string, Tag>> {
  const response = await postToServer(TAG_API_URL, { tagNames });
  return response.json() as Promise<Record<string, Tag>>;
}

function resolveTagBatch(data: Record<string, Tag>): void {
  for (const [tagName, tag] of Object.entries(data)) {
    pendingTags.get(tagName)?.resolve(tag);
    pendingTags.delete(tagName);
  }
}

function rejectTagBatch(tagNames: string[], error: unknown): void {
  for (const tagName of tagNames) {
    pendingTags.get(tagName)?.reject(error);
    pendingTags.delete(tagName);
  }
}

function flushTagBatch(tagNames: string[]): void {
  tagLimiter.run(async() => resolveTagBatch(await fetchTagBatch(tagNames)))
    .catch((error: unknown) => rejectTagBatch(tagNames, error));
}

export function fetchTagFromAPI(tagName: string): Promise<Tag> {
  return new Promise<Tag>((resolve, reject) => {
    pendingTags.set(tagName, { resolve, reject });
    tagBatchExecutor.add(tagName);
  });
}
