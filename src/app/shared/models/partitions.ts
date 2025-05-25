export interface partitions {
  name: string
}

export interface partitionParent {
  parentFullPath: string
  children: Children[]
}

export interface Children {
  name: string
  fullPath: string
}