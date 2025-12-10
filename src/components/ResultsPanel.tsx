import { useState, useEffect } from 'react';
import { GitBranch, Network, CircleDot, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ResultsPanelProps {
  entities: string[];
  trigger: number;
}

interface ResultSection {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  data: any;
  error?: string;
}

export function ResultsPanel({ entities, trigger }: ResultsPanelProps) {
  const [pathsData, setPathsData] = useState<any>(null);
  const [contextData, setContextData] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState({ paths: false, context: false, graph: false });
  const [expanded, setExpanded] = useState({ paths: true, context: true, graph: true });

  useEffect(() => {
    if (trigger === 0) return;

    const fetchData = async () => {
      // Fetch graph data
      setLoading(prev => ({ ...prev, graph: true }));
      try {
        const data = await api.getGraphData(100);
        setGraphData(data);
      } catch (e) {
        console.error('Graph data error:', e);
      } finally {
        setLoading(prev => ({ ...prev, graph: false }));
      }

      // Fetch paths if we have entities
      if (entities.length >= 2) {
        setLoading(prev => ({ ...prev, paths: true }));
        try {
          const data = await api.findPaths(entities.slice(0, 5), 3);
          setPathsData(data);
        } catch (e) {
          console.error('Paths error:', e);
        } finally {
          setLoading(prev => ({ ...prev, paths: false }));
        }
      }

      // Fetch context for each entity
      if (entities.length > 0) {
        setLoading(prev => ({ ...prev, context: true }));
        const contexts = [];
        for (const entity of entities.slice(0, 3)) {
          try {
            const data = await api.getEntityContext(entity);
            contexts.push(data);
          } catch (e) {
            console.error('Context error:', e);
          }
        }
        setContextData(contexts);
        setLoading(prev => ({ ...prev, context: false }));
      }
    };

    fetchData();
  }, [trigger, entities]);

  const toggleSection = (section: 'paths' | 'context' | 'graph') => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (trigger === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Network className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Results will appear here after querying</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Graph Data */}
      <ResultCard
        title="Graph Overview"
        icon={<Network className="h-4 w-4" />}
        loading={loading.graph}
        expanded={expanded.graph}
        onToggle={() => toggleSection('graph')}
      >
        {graphData && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <StatBadge label="Nodes" value={graphData.nodes} color="primary" />
              <StatBadge label="Relationships" value={graphData.relationships} color="accent" />
            </div>
            {graphData.data?.nodes?.slice(0, 8).map((node: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <CircleDot className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">{node.labels?.[0] || 'Node'}:</span>
                <span className="text-foreground truncate">{node.properties?.name || node.id}</span>
              </div>
            ))}
          </div>
        )}
      </ResultCard>

      {/* Entity Context */}
      <ResultCard
        title="Entity Context"
        icon={<CircleDot className="h-4 w-4" />}
        loading={loading.context}
        expanded={expanded.context}
        onToggle={() => toggleSection('context')}
      >
        {contextData.length > 0 ? (
          <div className="space-y-3">
            {contextData.map((ctx, i) => (
              <div key={i} className="p-2 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    {ctx.entity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {typeof ctx.context === 'string' ? ctx.context : JSON.stringify(ctx.context).slice(0, 200)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No entity context available</p>
        )}
      </ResultCard>

      {/* Paths */}
      <ResultCard
        title="Entity Paths"
        icon={<GitBranch className="h-4 w-4" />}
        loading={loading.paths}
        expanded={expanded.paths}
        onToggle={() => toggleSection('paths')}
      >
        {pathsData?.paths?.length > 0 ? (
          <div className="space-y-2">
            {pathsData.paths.slice(0, 5).map((path: any, i: number) => (
              <div key={i} className="flex items-center gap-1 text-xs flex-wrap">
                {Array.isArray(path) ? path.map((node: any, j: number) => (
                  <span key={j} className="flex items-center gap-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded",
                      j % 2 === 0 ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                    )}>
                      {typeof node === 'string' ? node : node.name || 'Node'}
                    </span>
                    {j < path.length - 1 && <span className="text-muted-foreground">→</span>}
                  </span>
                )) : (
                  <span className="text-muted-foreground">{JSON.stringify(path)}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {entities.length < 2 ? 'Need at least 2 entities to find paths' : 'No paths found'}
          </p>
        )}
      </ResultCard>
    </div>
  );
}

function ResultCard({
  title,
  icon,
  loading,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: 'primary' | 'accent' }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg",
      color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'
    )}>
      <span className={cn("text-lg font-semibold", color === 'primary' ? 'text-primary' : 'text-accent')}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
