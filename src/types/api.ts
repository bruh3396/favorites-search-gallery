import { TagCategoryMap } from "@/types/search";

export type EncodedTagCategory = number | null

export type Post = {
  id: string
  width: number
  height: number
  score: number
  rating: string
  change: number
  tags: string
  fileURL: string
  previewURL: string
  tagCategories: TagCategoryMap
}

export type PostResponse =
  | { status: "ok"; raw: string }
  | { status: "rate_limited", id: string }
  | { status: "error", id: string }

export type TagInfo = {
  tag: string
  type: string
  count: number
}

export type RawPost = {
  preview_url: string
  sample_url: string
  file_url: string
  directory: number
  hash: string
  width: number
  height: number
  id: number
  image: string
  change: number
  owner: string
  parent_id: number
  rating: string
  sample: boolean
  sample_height: number
  sample_width: number
  score: number
  tags: string
  source: string
  status: string
  has_notes: boolean
  comment_count: number
  tag_info?: TagInfo[]
}

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited"; }
