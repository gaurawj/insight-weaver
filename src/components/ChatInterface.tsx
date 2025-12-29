import { useState, useRef, useEffect } from 'react';
import { Send, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { api, QueryResponse } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  contexts?: QueryResponse['contexts'];
  reasoning?: QueryResponse['reasoning'];
}

interface ChatInterfaceProps {
  onQueryResponse: (response: QueryResponse) => void;
}

export function ChatInterface({ onQueryResponse }: ChatInterfaceProps) {
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
    if (!input.trim() || loading) return;

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
            <h3 className="text-xl font-semibold text-foreground mb-2">CodeBase RAG</h3>
            <p className="text-sm max-w-md leading-relaxed">
              Ask questions about your codebase. Get answers with reasoning and code context.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                AI
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border/50 text-foreground'
              }`}
            >
              <div className={`prose prose-sm max-w-none
                ${msg.role === 'assistant' ? 'prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-3 prose-headings:mt-4 prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3 prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-3 prose-ul:ml-4 prose-ol:my-3 prose-ol:ml-4 prose-li:text-foreground prose-li:mb-1.5 prose-li:leading-relaxed prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4 prose-blockquote:border-l-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0' : 'text-primary-foreground'}`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                You
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              AI
            </div>
            <div className="bg-card border border-border/50 rounded-lg px-5 py-4">
              <span className="text-muted-foreground text-sm">Thinking...</span>
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
              placeholder="Ask about your codebase..."
              disabled={loading}
              rows={1}
              className="min-h-[44px] max-h-32 resize-none bg-secondary/50 border-border/50"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
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
