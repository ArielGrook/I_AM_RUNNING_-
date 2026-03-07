'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Terminal,
  Play,
  RotateCcw,
  Square,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
  Bot,
  DollarSign,
} from 'lucide-react';

// ─────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────

interface LogEntry {
  time: string;
  type: 'status' | 'tool_call' | 'tool_result' | 'ai_text' | 'deploy' | 'error';
  message: string;
}

interface DevAgentResponse {
  success: boolean;
  log: LogEntry[];
  finalText: string | null;
  tokens: { input: number; output: number };
  error?: string;
}

// ─────────────────────────────────────────────
// КОНФИГ МОДЕЛЕЙ
// ─────────────────────────────────────────────

const PROVIDERS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  claude: {
    label: 'Claude',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Sonnet 4' },
      { value: 'claude-opus-4-20250115', label: 'Opus 4' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'o1', label: 'o1' },
      { value: 'o3', label: 'o3' },
    ],
  },
  deepseek: {
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-chat', label: 'Chat' },
      { value: 'deepseek-reasoner', label: 'Reasoner' },
    ],
  },
};

// ─────────────────────────────────────────────
// СТИЛИ ДЛЯ ТИПОВ ЛОГОВ
// ─────────────────────────────────────────────

function getLogStyle(type: LogEntry['type']): { color: string; icon: React.ReactNode } {
  switch (type) {
    case 'status':
      return { color: 'text-zinc-400', icon: <Loader2 className="w-3 h-3" /> };
    case 'tool_call':
      return { color: 'text-blue-400', icon: <Wrench className="w-3 h-3" /> };
    case 'tool_result':
      return { color: 'text-green-400', icon: <CheckCircle2 className="w-3 h-3" /> };
    case 'ai_text':
      return { color: 'text-purple-400', icon: <Bot className="w-3 h-3" /> };
    case 'deploy':
      return { color: 'text-yellow-400', icon: <Play className="w-3 h-3" /> };
    case 'error':
      return { color: 'text-red-400', icon: <XCircle className="w-3 h-3" /> };
    default:
      return { color: 'text-zinc-400', icon: null };
  }
}

// ─────────────────────────────────────────────
// КОМПОНЕНТ
// ─────────────────────────────────────────────

export default function DevConsolePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  // Auth (sessionStorage, как в SEO page)
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem('admin_session');
    if (session !== 'true') {
      router.replace(`/${locale}/admin`);
    } else {
      setHasSession(true);
    }
  }, [locale, router]);

  // State
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('claude');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tokens, setTokens] = useState<{ input: number; output: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll лог
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  // При смене провайдера — выбрать первую модель
  useEffect(() => {
    const models = PROVIDERS[provider]?.models;
    if (models && models.length > 0) {
      setModel(models[0].value);
    }
  }, [provider]);

  // ── EXECUTE ──
  async function handleExecute() {
    if (!prompt.trim() || isRunning) return;

    setIsRunning(true);
    setLog([]);
    setTokens(null);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/dev-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, model, autoDeploy }),
        signal: abortRef.current.signal,
      });

      const data: DevAgentResponse = await response.json();

      setLog(data.log);
      setTokens(data.tokens);

      if (!data.success) {
        setError(data.error || 'Unknown error');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setLog(prev => [...prev, { time: new Date().toLocaleTimeString('en-GB'), type: 'error', message: 'Aborted by user' }]);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }

  // ── STOP ──
  function handleStop() {
    abortRef.current?.abort();
  }

  // ── ROLLBACK ──
  async function handleRollback() {
    if (isRollingBack) return;

    const confirmed = window.confirm(
      'This will revert the last commit, rebuild, and restart. Continue?'
    );
    if (!confirmed) return;

    setIsRollingBack(true);
    setError(null);

    try {
      const response = await fetch('/api/dev-agent/rollback', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setLog(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString('en-GB'), type: 'status', message: `Rolled back to ${data.revertedTo || 'previous commit'}` },
          { time: new Date().toLocaleTimeString('en-GB'), type: 'status', message: '✅ Rollback complete. Site rebuilt and restarted.' },
        ]);
      } else {
        setError(data.error || 'Rollback failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsRollingBack(false);
    }
  }

  // ── RENDER ──
  if (!hasSession) return null;

  const selectCls = 'px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-orange-500';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/admin`)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Terminal className="w-5 h-5 text-orange-500" />
          <h1 className="text-lg font-semibold">Dev Console</h1>
        </div>
        {tokens && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <DollarSign className="w-3 h-3" />
            <span>{tokens.input.toLocaleString()} in / {tokens.output.toLocaleString()} out</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 gap-4 max-w-5xl mx-auto w-full">

        {/* Controls Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Provider */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className={selectCls}
            disabled={isRunning}
          >
            {Object.entries(PROVIDERS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>

          {/* Model */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={selectCls}
            disabled={isRunning}
          >
            {PROVIDERS[provider]?.models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Auto-deploy toggle */}
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDeploy}
              onChange={(e) => setAutoDeploy(e.target.checked)}
              disabled={isRunning}
              className="rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
            />
            Auto-deploy
          </label>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          {isRunning ? (
            <Button
              onClick={handleStop}
              variant="outline"
              size="sm"
              className="border-red-700 text-red-400 hover:bg-red-950"
            >
              <Square className="w-4 h-4 mr-1.5" />
              Stop
            </Button>
          ) : (
            <>
              <Button
                onClick={handleRollback}
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                disabled={isRollingBack}
              >
                <RotateCcw className={`w-4 h-4 mr-1.5 ${isRollingBack ? 'animate-spin' : ''}`} />
                {isRollingBack ? 'Rolling back...' : 'Rollback'}
              </Button>
              <Button
                onClick={handleExecute}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={!prompt.trim()}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Execute
              </Button>
            </>
          )}
        </div>

        {/* Prompt textarea */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Paste your prompt here..."
          disabled={isRunning}
          rows={8}
          className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-orange-500 resize-y min-h-[120px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleExecute();
            }
          }}
        />

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Log area */}
        {log.length > 0 && (
          <div className="flex-1 min-h-[300px] rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
              <Terminal className="w-3 h-3" />
              <span>Execution Log</span>
              <span className="ml-auto">{log.length} entries</span>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-1 font-mono text-xs">
                {log.map((entry, i) => {
                  const style = getLogStyle(entry.type);
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-zinc-600 flex-shrink-0 w-[65px]">{entry.time}</span>
                      <span className={`flex-shrink-0 mt-0.5 ${style.color}`}>{style.icon}</span>
                      <span className={`${style.color} break-all`}>{entry.message}</span>
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
