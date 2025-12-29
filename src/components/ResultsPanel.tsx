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
          <div className="space-y-3">
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

            {/* Detailed Steps */}
            <div className="space-y-2">
              {queryResponse.reasoning.retrieval_steps.map((step, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 text-xs space-y-2 border border-border/30">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <CircleDot className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground">{step.context_name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{step.context_type}</span>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5">
                    {step.file_path && (
                      <>
                        <span className="text-muted-foreground">File:</span>
                        <span className="text-foreground font-mono">{step.file_path || '—'}</span>
                      </>
                    )}
                    <span className="text-muted-foreground">Lines:</span>
                    <span className="text-foreground">{step.line_range}</span>
                    <span className="text-muted-foreground">Relevance:</span>
                    <span className="text-success font-medium">{step.relevance_score.toFixed(2)}</span>
                    <span className="text-muted-foreground">Method:</span>
                    <span className="text-foreground">{step.retrieval_method}</span>
                    {step.hop_distance !== undefined && step.hop_distance !== null && (
                      <>
                        <span className="text-muted-foreground">Hop Distance:</span>
                        <span className="text-foreground">{step.hop_distance}</span>
                      </>
                    )}
                    {step.semantic_score !== undefined && step.semantic_score !== null && (
                      <>
                        <span className="text-muted-foreground">Semantic Score:</span>
                        <span className="text-foreground">{step.semantic_score.toFixed(2)}</span>
                      </>
                    )}
                    {step.keywords_matched && step.keywords_matched.length > 0 && (
                      <>
                        <span className="text-muted-foreground">Keywords:</span>
                        <span className="text-foreground">{step.keywords_matched.join(', ')}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Graph Path */}
                  {step.graph_path && (
                    <div className="pl-5 pt-1">
                      <span className="text-muted-foreground">Path: </span>
                      <span className="text-accent font-mono text-[11px]">{step.graph_path}</span>
                    </div>
                  )}
                  
                  {/* Explanation */}
                  {step.explanation && (
                    <div className="pl-5 pt-1 text-foreground/80 italic border-l-2 border-primary/30 ml-5 pl-2">
                      {step.explanation}
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
