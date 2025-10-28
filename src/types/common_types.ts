export type Layout = "row" | "square" | "grid" | "column" | "native"
export type BackwardNavigationKey = "a" | "A" | "ArrowLeft"
export type ForwardNavigationKey = "d" | "D" | "ArrowRight"
export type NavigationKey = BackwardNavigationKey | ForwardNavigationKey
export type ExitKey = "Escape" | "Delete" | "Backspace"
export type MediaExtension = "jpg" | "png" | "jpeg" | "gif" | "mp4"
export type AnimatedExtension = "gif" | "mp4"
export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ImageCursor = "zoom-in" | "zoom-out" | "auto"
export type TagCategory = "general" | "artist" | "unknown" | "copyright" | "character" | "metadata"
export type MetadataMetric = "default" | "id" | "score" | "width" | "height" | "creationTimestamp" | "lastChangedTimestamp" | "random" | "duration"
export type SortingMethod = MetadataMetric
export type SearchableMetadataMetric = "id" | "score" | "width" | "height" | "duration"
export type MetadataComparator = ":" | ":<" | ":>"
export type Timeout = undefined | ReturnType<typeof setTimeout>
export type ContentType = "image" | "video" | "gif"
export type SkeletonAnimation = "pulse" | "shine"
export type MediaExtensionMapping = {
  id: string
  extension: MediaExtension
}
export type TagModificationDatabaseRecord = {
  id: string
  tags: string
}
export type AliasMap = Record<string, Set<string>>
export type TagCategoryMapping = {
  id: string
  category: TagCategory
}
export type AwesompleteSuggestion = {
  label: string
  value: string
  type: string
}
export type Dimensions2D = {
  width: number
  height: number
}
export type Post = {
  id: string
  height: number
  score: number
  fileURL: string
  parentId: string
  sampleURL: string
  sampleWidth: number
  sampleHeight: number
  previewURL: string
  rating: string
  tags: string
  width: number
  change: number
  md5: string
  creatorId: string
  hasChildren: boolean
  createdAt: string
  status: string
  source: string
  hasNotes: boolean
  hasComments: boolean
  previewWidth: number
  previewHeight: number
}
export enum PerformanceProfile {
  NORMAL = 0,
  MEDIUM = 3,
  LOW = 1,
  POTATO = 2
}
export enum ClickCode {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2
}
export enum DiscreteRating {
  EXPLICIT = 4,
  QUESTIONABLE = 2,
  SAFE = 1
}
export interface Searchable {
  tags: Set<string>;
}
