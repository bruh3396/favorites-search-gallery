import * as API from "../../../../lib/api/api";
import * as Extensions from "../../../../store/indexed_db/extensions";
import { FavoritesDatabaseRecord, FavoritesMetadataDatabaseRecord } from "../../../../types/primitives/composites";
import { DiscreteRating } from "../../../../types/primitives/enums";
import { Events } from "../../../../lib/globals/events";
import { FavoriteMetricMap } from "../../../../types/interfaces/interfaces";
import { GeneralSettings } from "../../../../config/general_settings";
import { Rating } from "../../../../types/primitives/primitives";
import { ThrottledQueue } from "../../../../components/functional/throttled_queue";
import { createEmptyPost } from "../favorite/favorite_type_utils";
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

async function fetchMissingMetadata(): Promise<void> {
  for (const metadata of UPDATE_QUEUE) {
    await THROTTLED_FETCH_QUEUE.wait();
    metadata.populateFromAPI();
  }
}

export function setupFavoriteMetadata(): void {
  THROTTLED_FETCH_QUEUE.pause();
  Events.favorites.favoritesLoaded.on(() => {
    THROTTLED_FETCH_QUEUE.resume();
    fetchMissingMetadata();
  }, { once: true });
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

  public async populate(object: FavoritesDatabaseRecord | HTMLElement): Promise<void> {
    if (object instanceof HTMLElement) {
      this.populateFromAPI();
      return;
    }

    if (object.metadata === undefined) {
      await THROTTLED_FETCH_QUEUE.wait();
      await this.populateFromAPI();
      Events.favorites.missingMetadataFound.emit(this.id);
      return;
    }
    this.populateFromDatabase(object);

    if (this.isEmpty) {
      await THROTTLED_FETCH_QUEUE.wait();
      await this.populateFromAPI();
      Events.favorites.missingMetadataFound.emit(this.id);
    }
  }

  public async populateFromAPI(): Promise<void> {
    if (tooManyPendingRequests()) {
      UPDATE_QUEUE.push(this);
      return;
    }
    PENDING_REQUESTS.add(this.id);
    const post = await API.fetchPostFromAPI(this.id).catch(createEmptyPost);

    PENDING_REQUESTS.delete(this.id);
    Extensions.setExtensionFromPost(post);
    validateTags(post);
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
