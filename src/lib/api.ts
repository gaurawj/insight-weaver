const API_BASE = 'http://localhost:8000';

// Request types
export interface ParserRequest {
  file_path: string;
  save_output?: boolean;
}

export interface StorageRequest {
  json_file_path: string;
  verbose?: boolean;
}

export interface QueryRequest {
  query: string;
  current_file?: string;
  current_line?: number;
}

export interface Neo4jRequest {
  test_connection?: boolean;
  db_name?: string;
}

// Response types
export interface StatisticItem {
  label: string;
  count: number;
}

export interface RelationshipItem {
  type: string;
  count: number;
}

export interface EmbeddingStats {
  total_embeddings_generated: number;
  total_tokens_used: number;
  api_calls_made: number;
  estimated_cost_usd: number;
}

export interface ParserResponse {
  status: string;
  timestamp: string;
  root_directory: string;
  total_files: number;
  files_analyzed: number;
  files_skipped: number;
  output_path?: string;
  error?: string;
}

export interface StorageResponse {
  status: string;
  timestamp: string;
  total_nodes: number;
  total_relationships: number;
  node_types: StatisticItem[];
  relationship_types: RelationshipItem[];
  embeddings: EmbeddingStats;
  error?: string;
}

export interface RetrievalStep {
  context_name: string;
  context_type: string;
  file_path: string;
  line_range: string;
  relevance_score: number;
  retrieval_method: string;
  explanation: string;
  hop_distance?: number;
  graph_path?: string;
  semantic_score?: number;
  keywords_matched?: string[];
}

export interface RetrievalSummary {
  total_contexts: number;
  by_method: Record<string, number>;
  total_relationships: number;
}

export interface ReasoningData {
  query: string;
  timestamp: string;
  summary: RetrievalSummary;
  retrieval_steps: RetrievalStep[];
}

export interface CodeContext {
  content: string;
  file_path: string;
  line_start: number;
  line_end: number;
  type: string;
  name: string;
  relevance_score: number;
}

export interface QueryResponse {
  status: string;
  timestamp: string;
  query: string;
  response: string;
  contexts_retrieved: number;
  contexts: CodeContext[];
  reasoning?: ReasoningData;
  error?: string;
}

export interface Neo4jResponse {
  status: string;
  timestamp: string;
  message: string;
  total_nodes?: number;
  total_relationships?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export const api = {
  async healthCheck(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async connectNeo4j(testConnection = true, dbName?: string): Promise<Neo4jResponse> {
    const res = await fetch(`${API_BASE}/neo4j`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_connection: testConnection, db_name: dbName || undefined }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async parseCodebase(request: ParserRequest): Promise<ParserResponse> {
    const res = await fetch(`${API_BASE}/parser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async storeToNeo4j(request: StorageRequest): Promise<StorageResponse> {
    const res = await fetch(`${API_BASE}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async query(request: QueryRequest): Promise<QueryResponse> {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
