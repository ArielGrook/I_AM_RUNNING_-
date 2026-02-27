export interface CraftNode {
  type: { resolvedName: string };
  props: Record<string, unknown>;
  nodes: string[];
  linkedNodes?: Record<string, string>;
}

export interface CraftJson {
  [nodeId: string]: CraftNode;
}

export interface ExportResult {
  html: string;
  css: string;
  assets: Array<{ filename: string; url: string }>;
}
