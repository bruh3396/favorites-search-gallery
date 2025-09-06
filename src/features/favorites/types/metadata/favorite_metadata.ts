import * as Extensions from "../../../../lib/global/extensions";
import { FavoritesDatabaseRecord, FavoritesMetadataDatabaseRecord } from "../../../../types/primitives/composites";
import { DiscreteRating } from "../../../../types/primitives/enums";
import { Events } from "../../../../lib/global/events/events";
import { FavoriteMetricMap } from "../../../../types/interfaces/interfaces";
import { GeneralSettings } from "../../../../config/general_settings";
import { Post } from "../../../../types/api/api_types";
import { Rating } from "../../../../types/primitives/primitives";
import { ThrottledQueue } from "../../../../lib/components/throttled_queue";
import { fetchPostFromAPISafe } from "../../../../lib/api/api";
import { validateTags } from "../favorite/favorite_item";

const PENDING_REQUESTS = new Set<string>();
const UPDATE_QUEUE: FavoriteMetadata[] = [];
const MAX_PENDING_REQUESTS = 250;
const THROTTLED_FETCH_QUEUE = new ThrottledQueue(GeneralSettings.throttledMetadataAPIRequestDelay);

function decodeRating(rating: string): Rating {
  return {
    "Explicit": DiscreteRating.EXPLICIT,
    "E": DiscreteRating.EXPLICIT,
    "e": DiscreteRating.EXPLICIT,
    "Questionable": DiscreteRating.QUESTIONABLE,
    "Q": DiscreteRating.QUESTIONABLE,
    "q": DiscreteRating.QUESTIONABLE,
    "Safe": DiscreteRating.SAFE,
    "S": DiscreteRating.SAFE,
    "s": DiscreteRating.SAFE
  }[rating] ?? DiscreteRating.EXPLICIT;
}

export function encodeRating(rating: number): string {
  return {
    [DiscreteRating.EXPLICIT]: "Explicit",
    [DiscreteRating.QUESTIONABLE]: "Questionable",
    [DiscreteRating.SAFE]: "Safe"
  }[rating] ?? "Explicit";
}

function tooManyPendingRequests(): boolean {
  return PENDING_REQUESTS.size > MAX_PENDING_REQUESTS;
}

export async function fetchMissingMetadata(): Promise<void> {
  while (UPDATE_QUEUE.length > 0) {
    const metadata = UPDATE_QUEUE.shift();

    if (metadata === undefined) {
      break;
    }
    await THROTTLED_FETCH_QUEUE.wait();
    metadata.populateFromAPI()
      .then(() => {
        Events.favorites.missingMetadataFound.emit(metadata.id);
      });
  }
}

export class FavoriteMetadata {
  public metrics: FavoriteMetricMap;
  public id: string;
  public rating: Rating;
  public isDeleted: boolean;

  constructor(id: string, record: FavoritesDatabaseRecord | HTMLElement) {
    this.metrics = {
      id: parseInt(id),
      width: 0,
      height: 0,
      score: 0,
      creationTimestamp: 0,
      lastChangedTimestamp: 0,
      default: 0,
      random: 0
    };
    this.id = id;
    this.rating = DiscreteRating.EXPLICIT;
    this.isDeleted = false;
    this.populate(record);
  }

  public get isEmpty(): boolean {
    return this.metrics.width === 0 && this.metrics.height === 0;
  }

  public get json(): string {
    return JSON.stringify(this.databaseRecord);
  }

  public get databaseRecord(): FavoritesMetadataDatabaseRecord {
    return {
      width: this.metrics.width,
      height: this.metrics.height,
      score: this.metrics.score,
      rating: this.rating,
      create: this.metrics.creationTimestamp,
      change: this.metrics.lastChangedTimestamp,
      deleted: this.isDeleted
    };
  }

  public get pixelCount(): number {
    return this.metrics.width * this.metrics.height;
  }

  public populate(object: FavoritesDatabaseRecord | HTMLElement): void {
    if (object instanceof HTMLElement) {
      this.populateFromAPI();
      return;
    }

    if (object.metadata === undefined) {
      UPDATE_QUEUE.push(this);
      return;
    }
    this.populateFromDatabase(object);

    if (this.isEmpty) {
      UPDATE_QUEUE.push(this);
    }
  }

  public async populateFromAPI(): Promise<void> {
    if (tooManyPendingRequests()) {
      UPDATE_QUEUE.push(this);
      return;
    }
    PENDING_REQUESTS.add(this.id);
    const post = await fetchPostFromAPISafe(this.id);

    PENDING_REQUESTS.delete(this.id);
    Extensions.setExtensionFromPost(post);
    validateTags(post);
    this.populateFromPost(post);
  }

  private populateFromPost(post: Post): void {
    this.metrics.width = post.width;
    this.metrics.height = post.height;
    this.metrics.score = post.score;
    this.metrics.creationTimestamp = Date.parse(post.createdAt);
    this.metrics.lastChangedTimestamp = post.change;
    this.rating = decodeRating(post.rating);
  }

  private populateFromDatabase(record: FavoritesDatabaseRecord): void {
    this.metrics.width = record.metadata.width;
    this.metrics.height = record.metadata.height;
    this.metrics.score = record.metadata.score;
    this.rating = record.metadata.rating as Rating;
    this.metrics.creationTimestamp = record.metadata.create;
    this.metrics.lastChangedTimestamp = record.metadata.change;
    this.isDeleted = record.metadata.deleted;
  }
}
