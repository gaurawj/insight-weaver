import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, FileCode, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { api, QueryResponse } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  contexts?: QueryResponse['contexts'];
  reasoning?: QueryResponse['reasoning'];
}

interface ChatInterfaceProps {
  disabled: boolean;
  onQueryResponse: (response: QueryResponse) => void;
}

export function ChatInterface({ disabled, onQueryResponse }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [currentLine, setCurrentLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const query = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const response = await api.query({
        query,
        current_file: currentFile || undefined,
        current_line: currentLine ? parseInt(currentLine) : undefined,
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        contexts: response.contexts,
        reasoning: response.reasoning,
      }]);
      onQueryResponse(response);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles className="h-12 w-12 mb-4 text-primary animate-pulse-glow" />
            <h3 className="text-lg font-medium text-foreground mb-2">CodeBase RAG</h3>
            <p className="text-sm max-w-md">
              Ask questions about your codebase. Get answers with reasoning and code context.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/80 text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              
              {/* Show contexts retrieved */}
              {msg.contexts && msg.contexts.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                  <span className="text-xs text-muted-foreground">Code contexts:</span>
                  {msg.contexts.slice(0, 3).map((ctx, j) => (
                    <div key={j} className="text-xs px-2 py-1 rounded bg-background/50">
                      <span className="text-primary">{ctx.name}</span>
                      <span className="text-muted-foreground ml-1">({ctx.type})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
            <div className="bg-secondary/80 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/50">
        {/* Optional context inputs */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <FileCode className="h-3 w-3" />
          {showContext ? 'Hide context options' : 'Add file/line context (optional)'}
        </button>
        
        {showContext && (
          <div className="px-4 pb-2 flex gap-2">
            <Input
              placeholder="Current file path"
              value={currentFile}
              onChange={(e) => setCurrentFile(e.target.value)}
              className="text-xs h-8 bg-secondary/50"
            />
            <Input
              placeholder="Line #"
              type="number"
              value={currentLine}
              onChange={(e) => setCurrentLine(e.target.value)}
              className="text-xs h-8 w-20 bg-secondary/50"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 pt-2">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Connect & store codebase first...' : 'Ask about your codebase...'}
              disabled={disabled || loading}
              rows={1}
              className="min-h-[44px] max-h-32 resize-none bg-secondary/50 border-border/50"
            />
            <Button
              type="submit"
              disabled={disabled || loading || !input.trim()}
              className="h-[44px] w-[44px] p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
