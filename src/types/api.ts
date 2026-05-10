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

export type CompactPost = {
  id: string
  width: number
  height: number
  score: number
  rating: string
  change: number
  createdAt: string
  tags: string
  fileURL: string
  previewURL: string
}

export type PostResponse =
  | { status: "ok"; post: CompactPost }
  | { status: "deleted", id: string }
  | { status: "rate_limited", id: string }

export type EncodedTagCategory = number | null

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited"; }
