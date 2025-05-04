import { MetadataMetric } from "../primitives/primitives";

export interface Searchable {
  tags: Set<string>
}

export type MetricMap = {
  [key in MetadataMetric]: number;
}

export interface SearchableWithMetrics extends Searchable {
  metrics: MetricMap
}

export interface IUpscaleRequest {
  id: string
  action: string
  hasDimensions: boolean
  offscreenCanvas: OffscreenCanvas | null
  imageBitmap: ImageBitmap | null
  imageURL: string
  readonly transferable: OffscreenCanvas[]
}
