export type Post = {
  id : string
  height : number
  score : number
  fileURL : string
  parentId : string
  sampleURL : string
  sampleWidth : number
  sampleHeight : number
  previewURL : string
  rating : string
  tags : string
  width : number
  change : number
  md5 : string
  creatorId : string
  hasChildren : boolean
  createdAt : string
  status : string
  source : string
  hasNotes : boolean
  hasComments : boolean
  previewWidth : number
  previewHeight : number
}

export enum AddFavoriteStatus {
  ERROR = 0,
  ALREADY_ADDED = 1,
  NOT_LOGGED_IN = 2,
  SUCCESSFULLY_ADDED = 3
}

export enum RemoveFavoriteStatus {
  ERROR = 0,
  FORBIDDEN = 1,
  SUCCESSFULLY_REMOVED = 2,
}
