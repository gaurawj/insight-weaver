import { useState } from 'react';
import { Database, Plug, Upload, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ConnectionPanelProps {
  isConnected: boolean;
  onConnect: () => void;
  onUpload: () => void;
  hasUpload: boolean;
}

export function ConnectionPanel({ isConnected, onConnect, onUpload, hasUpload }: ConnectionPanelProps) {
  const [dbName, setDbName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await api.connect(dbName || undefined);
      onConnect();
      toast({ title: 'Connected', description: 'Successfully connected to Neo4j' });
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await api.uploadPdf(file);
      onUpload();
      toast({ title: 'Uploaded', description: `${file.name} processed successfully` });
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4" />
        <span>Database Connection</span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Database name (optional)"
          value={dbName}
          onChange={(e) => setDbName(e.target.value)}
          disabled={isConnected}
          className="bg-secondary/50 border-border/50"
        />
        <Button
          onClick={handleConnect}
          disabled={connecting || isConnected}
          className={isConnected ? 'bg-primary/20 text-primary' : ''}
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isConnected ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plug className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isConnected && (
        <div className="pt-2 border-t border-border/50">
          <label className="cursor-pointer">
            <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed transition-all ${
              hasUpload 
                ? 'border-primary/50 bg-primary/10 text-primary' 
                : 'border-border/50 hover:border-primary/30 hover:bg-secondary/30'
            }`}>
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : hasUpload ? (
                <Check className="h-5 w-5" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {hasUpload ? 'PDF Uploaded' : 'Upload PDF'}
              </span>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading || hasUpload}
            />
          </label>
        </div>
      )}
    </div>
  );
}
