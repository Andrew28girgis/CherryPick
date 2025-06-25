export interface partitions {
  name: string
  fullPath: string
}

export interface partitionParent {
  parentFullPath: string
  children: Children[]
}

export interface Children {
  name: string
  fullPath: string
  lastModified?: Date
}