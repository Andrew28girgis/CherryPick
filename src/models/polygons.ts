export interface Polygon {
  id: number
  Name: string
  PolygonJson: PolygonJson[]
  shoppingcenters: number
  minForlease?: number
  maxforlease?: number
  minspace?: number
  maxspace?: number
}

export interface PolygonJson {
  json: string
}
