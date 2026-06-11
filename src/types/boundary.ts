export type Boundary = "none" | "start" | "end"
export type BoundaryEdge = Exclude<Boundary, "none">
