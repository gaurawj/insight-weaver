import { useState } from 'react';
import { GitBranch, Network, CircleDot, FileCode, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QueryResponse, StorageResponse, Neo4jResponse } from '@/lib/api';

interface ResultsPanelProps {
  neo4jData: Neo4jResponse | null;
  storageData: StorageResponse | null;
  queryResponse: QueryResponse | null;
}

export function ResultsPanel({ neo4jData, storageData, queryResponse }: ResultsPanelProps) {
  const [expanded, setExpanded] = useState({ 
    graph: true, 
    reasoning: true, 
    contexts: true 
  });

  const toggleSection = (section: 'graph' | 'reasoning' | 'contexts') => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasData = neo4jData || storageData || queryResponse;

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Network className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Results will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Graph Stats */}
      {(neo4jData || storageData) && (
        <ResultCard
          title="Graph Overview"
          icon={<Network className="h-4 w-4" />}
          expanded={expanded.graph}
          onToggle={() => toggleSection('graph')}
        >
          <div className="space-y-3">
            <div className="flex gap-4 flex-wrap">
              <StatBadge 
                label="Nodes" 
                value={storageData?.total_nodes ?? neo4jData?.total_nodes ?? 0} 
                color="primary" 
              />
              <StatBadge 
                label="Relationships" 
                value={storageData?.total_relationships ?? neo4jData?.total_relationships ?? 0} 
                color="accent" 
              />
            </div>
            
            {storageData?.node_types && storageData.node_types.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Node Types:</span>
                <div className="flex flex-wrap gap-1">
                  {storageData.node_types.slice(0, 8).map((node, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {node.label}: {node.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {storageData?.embeddings && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Embeddings: {storageData.embeddings.total_embeddings_generated}</div>
                <div>Est. Cost: ${storageData.embeddings.estimated_cost_usd.toFixed(4)}</div>
              </div>
            )}
          </div>
        </ResultCard>
      )}

      {/* Reasoning Steps */}
      {queryResponse?.reasoning && (
        <ResultCard
          title="Retrieval Reasoning"
          icon={<Lightbulb className="h-4 w-4" />}
          expanded={expanded.reasoning}
          onToggle={() => toggleSection('reasoning')}
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {/* Summary */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                {queryResponse.reasoning.summary.total_contexts} contexts
              </span>
              <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                {queryResponse.reasoning.summary.total_relationships} relationships
              </span>
            </div>

            {/* Methods used */}
            {Object.entries(queryResponse.reasoning.summary.by_method).length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Methods:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(queryResponse.reasoning.summary.by_method).map(([method, count]) => (
                    <span key={method} className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">
                      {method}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2">
              {queryResponse.reasoning.retrieval_steps.slice(0, 5).map((step, i) => (
                <div key={i} className="p-2 rounded-lg bg-secondary/50 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{step.context_name}</span>
                    <span className="text-muted-foreground">({step.context_type})</span>
                  </div>
                  <div className="pl-5 text-muted-foreground">
                    {step.file_path} • {step.line_range}
                  </div>
                  <div className="pl-5 text-muted-foreground">
                    Score: {step.relevance_score.toFixed(2)} • {step.retrieval_method}
                  </div>
                  {step.explanation && (
                    <div className="pl-5 text-foreground/80 italic">
                      "{step.explanation}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ResultCard>
      )}

      {/* Code Contexts */}
      {queryResponse?.contexts && queryResponse.contexts.length > 0 && (
        <ResultCard
          title="Code Contexts"
          icon={<FileCode className="h-4 w-4" />}
          expanded={expanded.contexts}
          onToggle={() => toggleSection('contexts')}
        >
          <div className="space-y-2">
            {queryResponse.contexts.map((ctx, i) => (
              <div key={i} className="p-2 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    {ctx.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{ctx.type}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {ctx.file_path} ({ctx.line_start}-{ctx.line_end})
                </div>
                <pre className="text-xs text-foreground bg-background/50 p-2 rounded overflow-x-auto max-h-32">
                  {ctx.content.slice(0, 500)}{ctx.content.length > 500 ? '...' : ''}
                </pre>
              </div>
            ))}
          </div>
        </ResultCard>
      )}

      {/* Query Status */}
      {queryResponse && !queryResponse.reasoning && !queryResponse.contexts?.length && (
        <div className="text-center text-muted-foreground text-sm py-4">
          Query completed: {queryResponse.status}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
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
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
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
