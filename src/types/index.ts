export type AiProvider = "auto" | "openai-api" | "codex-cli";

export type RepotyConfig = {
  version: number;
  outDir: string;
  model: string;
  aiProvider: AiProvider;
  codexCommand: string;
  codexTimeoutMs: number;
  include: string[];
  exclude: string[];
  maxFileBytesForAi: number;
  maxConcurrentAiCalls: number;
  routes: {
    auto: boolean;
    minClusterSize: number;
  };
};

export type StaticMetadata = {
  language: string;
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
  interfaces: string[];
  types: string[];
  entrypoints: string[];
  warnings: string[];
  isTestFile: boolean;
  isConfigFile: boolean;
};

export type FileSummary = {
  path: string;
  hash: string;
  language: string;
  sizeBytes: number;
  purpose: string;
  domain: string;
  tags: string[];
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
  entrypoints: string[];
  usedFor: string[];
  relatedFiles: string[];
  warnings: string[];
  summaryConfidence: number;
  primaryRoute?: string;
  secondaryRoutes?: string[];
};

export type RouteSummary = {
  name: string;
  title: string;
  purpose: string;
  tags: string[];
  files: string[];
  entrypoints: string[];
  recommendedReadingOrder: string[];
  relatedRoutes: string[];
};

export type GraphEdgeType =
  | "imports"
  | "imported-by"
  | "same-folder"
  | "same-domain"
  | "shared-tag"
  | "same-route"
  | "test-target"
  | "config-affects";

export type GraphEdge = {
  from: string;
  to: string;
  type: GraphEdgeType;
  weight: number;
  reasons: string[];
};

export type ManifestData = {
  version: number;
  generatedAt: string;
  projectRoot: string;
  indexedFiles: number;
  routes: number;
  allFiles?: boolean;
};

export type RepoStore = {
  manifest: ManifestData;
  files: Record<string, FileSummary>;
  graph: { edges: GraphEdge[] };
  routes: Record<string, RouteSummary>;
  hashes: Record<string, string>;
  symbols: Record<
    string,
    {
      imports: string[];
      exports: string[];
      functions: string[];
      classes: string[];
    }
  >;
};

export type ScanResult = {
  path: string;
  absolutePath: string;
  sizeBytes: number;
  language: string;
};

export type IndexDiff = {
  newFiles: string[];
  changedFiles: string[];
  deletedFiles: string[];
  unchangedFiles: string[];
};

export type RelatedFileResult = {
  path: string;
  score: number;
  reasons: string[];
};
