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
  Settings,
} from 'lucide-react';

// ─────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────

interface LogEntry {
  time: string;
  type: 'status' | 'tool_call' | 'tool_result' | 'ai_text' | 'deploy' | 'error';
  message: string;
  full?: string;
}

interface DevAgentResponse {
  success: boolean;
  log: LogEntry[];
  finalText: string | null;
  aiOutputs: string[];
  tokens: { input: number; output: number };
  error?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

// ─────────────────────────────────────────────
// КОНФИГ МОДЕЛЕЙ
// ─────────────────────────────────────────────

const PROVIDERS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  claude: {
    label: 'Claude',
    models: [
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
      { value: 'claude-opus-4-6', label: 'Opus 4.6' },
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'o1', label: 'o1' },
      { value: 'o1-mini', label: 'o1 Mini' },
      { value: 'o3-mini', label: 'o3 Mini' },
    ],
  },
  gemini: {
    label: 'Gemini',
    models: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
    ],
  },
  deepseek: {
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek V3' },
      { value: 'deepseek-reasoner', label: 'DeepSeek R1' },
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
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tokens, setTokens] = useState<{ input: number; output: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [aiOutputs, setAiOutputs] = useState<string[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  const [showSettings, setShowSettings] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [fileTreeLoading, setFileTreeLoading] = useState(false);
  const [fileTreeError, setFileTreeError] = useState<string | null>(null);
  const [fileTreeExpanded, setFileTreeExpanded] = useState<Set<string>>(new Set(['app', 'lib', 'components', 'context-core']));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [configValues, setConfigValues] = useState({
    anthropicApiKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
    deepseekApiKey: '',
    githubToken: '',
    githubRepo: '',
    developerUserId: '',
  });
  const [configMasked, setConfigMasked] = useState<Record<string, string>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

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

  // ── SETTINGS ──
  async function loadSettings() {
    try {
      const res = await fetch('/api/dev-agent/config');
      const data = await res.json();
      if (data.config) {
        setConfigMasked(data.config);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }

  async function saveSettings() {
    setIsSavingConfig(true);
    setConfigSaved(false);
    try {
      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(configValues)) {
        if (value.trim()) {
          payload[key] = value.trim();
        }
      }

      if (Object.keys(payload).length === 0) {
        setIsSavingConfig(false);
        return;
      }

      const res = await fetch('/api/dev-agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setConfigMasked(data.config);
        setConfigValues({
          anthropicApiKey: '',
          openaiApiKey: '',
          geminiApiKey: '',
          deepseekApiKey: '',
          githubToken: '',
          githubRepo: '',
          developerUserId: '',
        });
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  }

  useEffect(() => {
    if (showSettings) loadSettings();
  }, [showSettings]);

  // ── EXECUTE ──
  async function handleExecute() {
    if (!prompt.trim() || isRunning) return;

    setIsRunning(true);
    setLog([]);
    setAiOutputs([]);
    setExpandedLines(new Set());
    setTokens(null);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/dev-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, model, autoDeploy: false }),
        signal: abortRef.current.signal,
      });

      const data: DevAgentResponse = await response.json();

      setLog(data.log);
      setAiOutputs(data.aiOutputs || []);
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

  // ── DEPLOY ──
  async function handleDeploy() {
    if (isDeploying) return;

    setIsDeploying(true);
    setError(null);

    try {
      const response = await fetch('/api/dev-agent/deploy', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setLog(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString('en-GB'), type: 'deploy', message: '✅ Deploy complete' },
        ]);
      } else {
        setError(data.error || 'Deploy failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsDeploying(false);
    }
  }

  // ── FILE TREE ──
  const loadFileTree = async () => {
    setFileTreeLoading(true);
    setFileTreeError(null);
    try {
      const res = await fetch('/api/dev-agent/files');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setFileTree(data.tree || []);
    } catch (err: unknown) {
      setFileTreeError(err instanceof Error ? err.message : String(err));
    } finally {
      setFileTreeLoading(false);
    }
  };

  // Load file tree automatically when session is confirmed
  useEffect(() => {
    if (hasSession) loadFileTree();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  const insertPathIntoPrompt = (filePath: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setPrompt(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '') + filePath);
      return;
    }
    const start = textarea.selectionStart ?? prompt.length;
    const end = textarea.selectionEnd ?? prompt.length;
    const before = prompt.slice(0, start);
    const after = prompt.slice(end);
    const prefix = before && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
    const newValue = before + prefix + filePath + after;
    setPrompt(newValue);
    requestAnimationFrame(() => {
      const pos = start + prefix.length + filePath.length;
      textarea.selectionStart = textarea.selectionEnd = pos;
      textarea.focus();
    });
  };

  const toggleFolder = (folderPath: string) => {
    setFileTreeExpanded(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map(node => {
      const isExpanded = fileTreeExpanded.has(node.path);
      const indent = depth * 16;
      if (node.type === 'dir') {
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full text-left text-xs py-0.5 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1.5 group"
              style={{ paddingLeft: `${8 + indent}px` }}
              title={node.path}
            >
              <span className="text-zinc-500 w-3 flex-shrink-0 text-center">{isExpanded ? '▾' : '▸'}</span>
              <span className="text-base leading-none flex-shrink-0">📁</span>
              <span className="text-zinc-400 truncate group-hover:text-zinc-200">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }
      return (
        <button
          key={node.path}
          onClick={() => insertPathIntoPrompt(node.path)}
          className="w-full text-left text-xs py-0.5 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1.5 group"
          style={{ paddingLeft: `${8 + indent}px` }}
          title={`Insert: ${node.path}`}
        >
          <span className="w-3 flex-shrink-0" />
          <span className="text-base leading-none flex-shrink-0">📄</span>
          <span className="text-zinc-300 truncate group-hover:text-orange-400">{node.name}</span>
        </button>
      );
    });

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
        <div className="flex items-center gap-3">
          {tokens && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <DollarSign className="w-3 h-3" />
              <span>{tokens.input.toLocaleString()} in / {tokens.output.toLocaleString()} out</span>
            </div>
          )}
          <button
            onClick={() => setShowFileTree(prev => !prev)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showFileTree ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            title="Toggle file tree"
          >
            📁
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-zinc-400 hover:text-white transition-colors ml-3"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSettings(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                API keys are stored on the server. Leave fields empty to keep current values.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={configValues.anthropicApiKey}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
                  placeholder={configMasked.anthropicApiKey || 'sk-ant-...'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={configValues.openaiApiKey}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                  placeholder={configMasked.openaiApiKey || 'sk-...'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  DeepSeek API Key
                </label>
                <input
                  type="password"
                  value={configValues.deepseekApiKey}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, deepseekApiKey: e.target.value }))}
                  placeholder={configMasked.deepseekApiKey || 'sk-...'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={configValues.geminiApiKey}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                  placeholder={configMasked.geminiApiKey || 'AIza...'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="border-t border-zinc-800" />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  GitHub Token
                </label>
                <input
                  type="password"
                  value={configValues.githubToken}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, githubToken: e.target.value }))}
                  placeholder={configMasked.githubToken || 'ghp_...'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  GitHub Repo URL
                </label>
                <input
                  type="text"
                  value={configValues.githubRepo}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, githubRepo: e.target.value }))}
                  placeholder={configMasked.githubRepo || 'https://github.com/user/repo.git'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Developer User ID (Supabase UUID)
                </label>
                <input
                  type="text"
                  value={configValues.developerUserId}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, developerUserId: e.target.value }))}
                  placeholder={configMasked.developerUserId || 'uuid-from-supabase'}
                  className="w-full px-3 py-2 rounded-md text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <Button
                onClick={saveSettings}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isSavingConfig}
              >
                {isSavingConfig ? 'Saving...' : configSaved ? '✓ Saved' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-row gap-0 w-full overflow-hidden">
        {/* File Tree Sidebar */}
        {showFileTree && (
          <div className="w-[280px] min-w-[280px] bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 flex-shrink-0">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Files</span>
              <button
                onClick={loadFileTree}
                disabled={fileTreeLoading}
                className="text-xs text-zinc-500 hover:text-orange-400 transition-colors disabled:opacity-40"
                title="Refresh"
              >
                {fileTreeLoading ? '⟳' : '↻'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {fileTreeLoading && fileTree.length === 0 && (
                <div className="px-4 py-3 text-xs text-zinc-500">Loading files...</div>
              )}
              {fileTreeError && (
                <div className="px-3 py-2 space-y-2">
                  <p className="text-xs text-red-400">{fileTreeError}</p>
                  <button
                    onClick={loadFileTree}
                    className="text-xs text-orange-400 hover:text-orange-300 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!fileTreeLoading && !fileTreeError && fileTree.length === 0 && (
                <div className="px-4 py-3 text-xs text-zinc-500">No files found.</div>
              )}
              {fileTree.length > 0 && (
                <div className="space-y-0.5 pr-1">
                  {renderTree(fileTree)}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">

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

          {/* Deploy button */}
          <Button
            onClick={handleDeploy}
            disabled={isRunning || isDeploying}
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
          >
            {isDeploying ? 'Deploying...' : '🚀 Deploy'}
          </Button>

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
          ref={textareaRef}
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
                  const isExpanded = expandedLines.has(i);
                  const hasFullContent = entry.full && entry.full.length > entry.message.length;

                  return (
                    <div key={i}>
                      <div
                        className={`flex items-start gap-2 ${hasFullContent ? 'cursor-pointer hover:bg-zinc-800/50 rounded px-1 -mx-1' : ''}`}
                        onClick={() => {
                          if (hasFullContent) {
                            setExpandedLines(prev => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }
                        }}
                      >
                        <span className="text-zinc-600 flex-shrink-0 w-[65px]">{entry.time}</span>
                        <span className={`flex-shrink-0 mt-0.5 ${style.color}`}>{style.icon}</span>
                        <span className={`${style.color} break-all`}>
                          {entry.message}
                          {hasFullContent && !isExpanded && (
                            <span className="text-zinc-600 ml-1">▸ click to expand</span>
                          )}
                        </span>
                      </div>
                      {isExpanded && entry.full && (
                        <pre className="ml-[85px] mt-1 mb-2 p-3 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                          {entry.full}
                        </pre>
                      )}
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}

        {/* AI Output panel */}
        {aiOutputs.length > 0 && (
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
              <Bot className="w-3 h-3" />
              <span>AI Output</span>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-4">
                {aiOutputs.map((output, i) => (
                  <div key={i} className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {output}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
