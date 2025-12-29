import { useState } from 'react';
import { Database, Plug, FolderCode, Check, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, Neo4jResponse, ParserResponse, StorageResponse } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ConnectionPanelProps {
  isConnected: boolean;
  onConnect: (data: Neo4jResponse) => void;
  onParse: (data: ParserResponse) => void;
  onStore: (data: StorageResponse) => void;
}

export function ConnectionPanel({ isConnected, onConnect, onParse, onStore }: ConnectionPanelProps) {
  const [dbName, setDbName] = useState('');
  const [codebasePath, setCodebasePath] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [storing, setStoring] = useState(false);
  const [parseComplete, setParseComplete] = useState(false);
  const [storeComplete, setStoreComplete] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await api.connectNeo4j(true, dbName || undefined);
      onConnect(response);
      toast({ title: 'Connected', description: response.message });
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const handleParse = async () => {
    if (!codebasePath.trim()) {
      toast({ title: 'Error', description: 'Please enter codebase path', variant: 'destructive' });
      return;
    }
    setParsing(true);
    try {
      const response = await api.parseCodebase({ file_path: codebasePath, save_output: true });
      if (response.status === 'success') {
        setParseComplete(true);
        if (response.output_path) {
          setJsonPath(response.output_path);
        }
        onParse(response);
        toast({ 
          title: 'Parsed', 
          description: `Analyzed ${response.files_analyzed} files` 
        });
      } else {
        toast({ title: 'Error', description: response.error || 'Parsing failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const handleStore = async () => {
    if (!jsonPath.trim()) {
      toast({ title: 'Error', description: 'Please enter JSON file path', variant: 'destructive' });
      return;
    }
    setStoring(true);
    try {
      const response = await api.storeToNeo4j({ json_file_path: jsonPath, verbose: false });
      if (response.status === 'success') {
        setStoreComplete(true);
        onStore(response);
        toast({ 
          title: 'Stored', 
          description: `${response.total_nodes} nodes, ${response.total_relationships} relationships` 
        });
      } else {
        toast({ title: 'Error', description: response.error || 'Storage failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } finally {
      setStoring(false);
    }
  };

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      {/* Neo4j Connection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>Neo4j Connection</span>
        </div>
        <Input
          placeholder="Database name (optional)"
          value={dbName}
          onChange={(e) => setDbName(e.target.value)}
          disabled={isConnected}
          className="bg-secondary/50 border-border/50 text-sm"
        />
        <Button
          onClick={handleConnect}
          disabled={connecting || isConnected}
          className={`w-full ${isConnected ? 'bg-primary/20 text-primary' : ''}`}
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isConnected ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Plug className="h-4 w-4 mr-2" />
          )}
          {isConnected ? 'Connected' : 'Connect to Neo4j'}
        </Button>
      </div>

      {isConnected && (
        <>
          {/* Parser */}
          <div className="pt-2 border-t border-border/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderCode className="h-4 w-4" />
              <span>Parse Codebase</span>
            </div>
            <Input
              placeholder="Codebase directory path"
              value={codebasePath}
              onChange={(e) => setCodebasePath(e.target.value)}
              disabled={parseComplete}
              className="bg-secondary/50 border-border/50 text-sm"
            />
            <Button
              onClick={handleParse}
              disabled={parsing || parseComplete || !codebasePath.trim()}
              variant="secondary"
              className={`w-full ${parseComplete ? 'bg-primary/20 text-primary' : ''}`}
            >
              {parsing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : parseComplete ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <FolderCode className="h-4 w-4 mr-2" />
              )}
              {parseComplete ? 'Parsed' : 'Parse Codebase'}
            </Button>
          </div>

          {/* Store */}
          <div className="pt-2 border-t border-border/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>Store to Graph</span>
            </div>
            <Input
              placeholder="JSON file path"
              value={jsonPath}
              onChange={(e) => setJsonPath(e.target.value)}
              disabled={storeComplete}
              className="bg-secondary/50 border-border/50 text-sm"
            />
            <Button
              onClick={handleStore}
              disabled={storing || storeComplete || !jsonPath.trim()}
              variant="secondary"
              className={`w-full ${storeComplete ? 'bg-primary/20 text-primary' : ''}`}
            >
              {storing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : storeComplete ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {storeComplete ? 'Stored' : 'Store to Neo4j'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
