import { useState } from 'react';
import { Braces, Zap } from 'lucide-react';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { ChatInterface } from '@/components/ChatInterface';
import { ResultsPanel } from '@/components/ResultsPanel';
import { ChatResponse } from '@/lib/api';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasUpload, setHasUpload] = useState(false);
  const [entities, setEntities] = useState<string[]>([]);
  const [resultsTrigger, setResultsTrigger] = useState(0);

  const handleChatResponse = (response: ChatResponse, query: string) => {
    // Extract entities from response or query
    const extractedEntities = response.entities || [];
    setEntities(extractedEntities);
    setResultsTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Braces className="h-5 w-5 text-background" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">GraphRAG</h1>
              <p className="text-xs text-muted-foreground">Knowledge Graph Explorer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConnected && hasUpload 
                ? 'bg-primary/20 text-primary' 
                : 'bg-secondary text-muted-foreground'
            }`}>
              <Zap className={`h-3 w-3 ${isConnected && hasUpload ? 'animate-pulse-glow' : ''}`} />
              {isConnected && hasUpload ? 'Ready' : 'Not Connected'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        <div className="grid lg:grid-cols-[280px_1fr_380px] gap-4 h-[calc(100vh-88px)]">
          {/* Left Sidebar - Connection */}
          <aside className="space-y-4">
            <ConnectionPanel
              isConnected={isConnected}
              onConnect={() => setIsConnected(true)}
              onUpload={() => setHasUpload(true)}
              hasUpload={hasUpload}
            />
            
            {/* Quick Stats */}
            {isConnected && hasUpload && (
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Query Info</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                    <span className="text-2xl font-bold gradient-text">{resultsTrigger}</span>
                    <span className="text-xs text-muted-foreground">Queries</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                    <span className="text-2xl font-bold text-accent">{entities.length}</span>
                    <span className="text-xs text-muted-foreground">Entities</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Center - Chat */}
          <div className="glass rounded-xl flex flex-col overflow-hidden">
            <ChatInterface
              disabled={!isConnected || !hasUpload}
              onChatResponse={handleChatResponse}
            />
          </div>

          {/* Right Sidebar - Results */}
          <aside className="glass rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border/50">
              <h2 className="text-sm font-medium">Auto-Generated Results</h2>
              <p className="text-xs text-muted-foreground">Paths, Context & Graph Data</p>
            </div>
            <ResultsPanel entities={entities} trigger={resultsTrigger} />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
