import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { FrozenCobaltTagCategory } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category";
import { RemoteTagDictionary } from "@/core/boundary/ports/remote_tag_dictionary/remote_tag_dictionary";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TagCategory } from "@/core/domain/tag_category/tag_category";

export interface FrozenCobaltRemoteTagDictionaryConfiguration {
  readonly url: string;
  readonly requestTimeout: number;
}

export const DEFAULT_FROZEN_COBALT_REMOTE_TAG_DICTIONARY_CONFIGURATION: FrozenCobaltRemoteTagDictionaryConfiguration = {
  url: "https://cdn.frozencobalt.stream/tag_dictionary/tag_dictionary_v1.txt",
  requestTimeout: 30_000
};

export interface FrozenCobaltRemoteTagDictionaryDependencies {
  scheduler: Scheduler;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
}

const TAG_CATEGORY_BY_DIGIT: readonly FrozenCobaltTagCategory[] = ["general", "artist", "copyright", "character", "metadata"];

export class FrozenCobaltRemoteTagDictionary implements RemoteTagDictionary {
  constructor(
    private readonly configuration: FrozenCobaltRemoteTagDictionaryConfiguration,
    private readonly dependencies: FrozenCobaltRemoteTagDictionaryDependencies
  ) { }

  public async fetch(): Promise<ReadonlyMap<string, TagCategory>> {
    return parseTagDictionary(await this.request());
  }

  private async request(): Promise<string> {
    const abortController = new AbortController();
    const cancelTimeout = this.dependencies.scheduler.schedule(() => abortController.abort(), this.configuration.requestTimeout);

    try {
      const response = await this.dependencies.fetch(this.configuration.url, { signal: abortController.signal });

      if (!response.ok) {
        throw new FrozenCobaltError("http", { status: response.status });
      }
      return await response.text();
    } catch (cause) {
      if (cause instanceof FrozenCobaltError) {
        throw cause;
      }
      throw new FrozenCobaltError(abortController.signal.aborted ? "timeout" : "network", { cause });
    } finally {
      cancelTimeout();
    }
  }
}

function parseTagDictionary(text: string): ReadonlyMap<string, TagCategory> {
  const tagDictionary = new Map<string, TagCategory>();

  for (const line of text.split("\n")) {
    if (line === "") {
      continue;
    }
    const category = TAG_CATEGORY_BY_DIGIT[Number(line[0])] as FrozenCobaltTagCategory | undefined;
    const name = line.slice(1);

    if (category === undefined || name === "") {
      throw new FrozenCobaltError("malformed", { subject: line });
    }
    tagDictionary.set(name, category);
  }

  if (tagDictionary.size === 0) {
    throw new FrozenCobaltError("malformed");
  }
  return tagDictionary;
}
