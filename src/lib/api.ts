const API_BASE = 'http://localhost:8000';

export interface ChatRequest {
  query: string;
  expand_depth?: number;
}

export interface EntityContextRequest {
  entity_name: string;
}

export interface PathRequest {
  entity_names: string[];
  max_hops?: number;
}

export interface ChatResponse {
  answer: string;
  provenance?: any[];
  entities?: string[];
  [key: string]: any;
}

export interface GraphData {
  nodes: number;
  relationships: number;
  data: {
    nodes: any[];
    relationships: any[];
  };
}

export const api = {
  async connect(dbName?: string) {
    const res = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_name: dbName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getEntityContext(entityName: string) {
    const res = await fetch(`${API_BASE}/entity-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_name: entityName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async findPaths(entityNames: string[], maxHops = 3) {
    const res = await fetch(`${API_BASE}/find-paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_names: entityNames, max_hops: maxHops }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getGraphData(limit = 1000): Promise<GraphData> {
    const res = await fetch(`${API_BASE}/graph-data?limit=${limit}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async disconnect() {
    const res = await fetch(`${API_BASE}/disconnect`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
