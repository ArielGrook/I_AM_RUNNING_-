/**
 * Chat Panel Component
 * 
 * Sidebar chat interface with streaming support and JSON-contract integration.
 * 
 * Stage 3 Module 7: Chat with ChatGPT
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import { ChatMessage, JsonContract } from '@/lib/types/chat';
import { cn } from '@/lib/utils';
import { sanitizePrompt } from '@/lib/utils/sanitize';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyContract: (contract: JsonContract) => void;
  className?: string;
}

export function ChatPanel({
  isOpen,
  onClose,
  onApplyContract,
  className,
}: ChatPanelProps) {
  const t = useTranslations('Chat');
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStream]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    // Sanitize input (BIG REVIEW #8)
    const sanitizedInput = sanitizePrompt(input);
    if (!sanitizedInput) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: sanitizedInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setCurrentStream('');

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedInput,
          context: { language: locale },
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let contract: JsonContract | null = null;

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'token') {
                setCurrentStream((prev) => prev + data.content);
              } else if (data.type === 'contract') {
                contract = data.contract;
              } else if (data.type === 'done') {
                // Create assistant message
                const assistantMessage: ChatMessage = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: currentStream,
                  timestamp: Date.now(),
                  contract: contract || undefined,
                };
                
                setMessages((prev) => [...prev, assistantMessage]);
                setCurrentStream('');
                
                // Auto-apply contract if present
                if (contract) {
                  setTimeout(() => {
                    onApplyContract(contract);
                  }, 500);
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error');
              }
            } catch (parseError) {
              console.error('Failed to parse stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled
        return;
      }
      
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('error'),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setCurrentStream('');
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setCurrentStream('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg flex flex-col z-50',
        isRTL && 'right-auto left-0 border-l-0 border-r',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h2 className="font-semibold">{t('title')}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('empty')}</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.contract && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApplyContract(message.contract!)}
                  >
                    {t('applyChanges')}
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {isStreaming && currentStream && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                <p className="text-sm whitespace-pre-wrap">
                  {currentStream}
                  <span className="animate-pulse">▋</span>
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('placeholder')}
            disabled={isStreaming}
            className="flex-1"
          />
          {isStreaming ? (
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t('streaming')}</span>
          </div>
        )}
      </div>
    </div>
  );
}








