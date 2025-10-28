import * as API from "../../../../lib/api/api";
import * as Extensions from "../../../../lib/global/extensions";
import { DiscreteRating, Post, Rating } from "../../../../types/common_types";
import { FavoriteMetricMap, FavoritesDatabaseRecord, FavoritesMetadataDatabaseRecord } from "../../../../types/favorite_types";
import { getFavorite, validateTags } from "../favorite/favorite_item";
import { Events } from "../../../../lib/global/events/events";
import { FAVORITES_PER_PAGE } from "../../../../lib/global/constants";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { getVideoDurationFromFavorite } from "../../../../lib/api/api_metadata";
import { isVideo } from "../../../../utils/content/content_type";
import { splitIntoChunks } from "../../../../utils/collection/array";

const FETCH_UPDATE_QUEUE: FavoriteMetadata[] = [];
const READY_UPDATE_QUEUE: FavoriteMetadata[] = [];
let databaseWritten = false;
let startedWritingDatabase = false;

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

export function onStartedStoringAllFavorites(): void {
  startedWritingDatabase = true;
}

export async function updateMissingMetadata(): Promise<void> {
  databaseWritten = true;

  for (const metadata of READY_UPDATE_QUEUE) {
    metadata.updateDatabase();
  }
  const chunks = splitIntoChunks(FETCH_UPDATE_QUEUE, FAVORITES_PER_PAGE).filter(chunk => chunk.length > 0);

  if (chunks.length === 0) {
    return;
  }

  await Promise.all(chunks.map((chunk) => {
    return API.fetchMultiplePostsFromAPISafe(chunk.map(metadata => metadata.id))
      .then(posts => chunk.forEach(metadata => metadata.processPost(posts[metadata.id])));
  }));
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
      random: 0,
      duration: 0
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
      deleted: this.isDeleted,
      duration: this.metrics.duration
    };
  }

  public get pixelCount(): number {
    return this.metrics.width * this.metrics.height;
  }

  public populate(object: FavoritesDatabaseRecord | HTMLElement): void {
    if (object instanceof HTMLElement) {
      if (!FavoritesSettings.fetchMultiplePostWhileFetchingFavorites) {
        this.populateFromAPI();
      }
      this.setDuration();
      return;
    }

    if (object.metadata === undefined) {
      FETCH_UPDATE_QUEUE.push(this);
      return;
    }
    this.populateFromDatabase(object);
    this.setDurationFromRecord();

    if (this.isEmpty) {
      FETCH_UPDATE_QUEUE.push(this);
    }
  }

  public async populateFromAPI(): Promise<void> {
    this.processPost(await API.fetchPostFromAPISafe(this.id));
  }

  public processPost(post: Post): boolean {
    this.populateFromPost(post);

    if (this.isEmpty) {
      return false;
    }

    if (databaseWritten) {
      this.updateDatabase();
    } else if (startedWritingDatabase) {
      READY_UPDATE_QUEUE.push(this);
    }
    Extensions.setExtensionFromPost(post);
    validateTags(post);
    return true;
  }

  public updateDatabase(): void {
    Events.favorites.missingMetadataFound.emit(this.id);
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
    this.metrics.duration = record.metadata.duration ?? 0;
    this.isDeleted = record.metadata.deleted;
  }

  private async setDuration(): Promise<boolean> {
    const favorite = getFavorite(this.id);

    if (favorite !== undefined && isVideo(favorite) && this.metrics.duration === 0) {
      this.metrics.duration = await getVideoDurationFromFavorite(favorite);
      return true;
    }
    return false;
  }

  private async setDurationFromRecord(): Promise<void> {
    if (await this.setDuration()) {
      this.updateDatabase();
    }
  }
}
