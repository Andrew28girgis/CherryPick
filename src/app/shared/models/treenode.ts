// Define the structure for a single node in the tree
export interface TreeContactNode {
  name: string;
  role: string;
  children?: TreeContactNode[];
}
