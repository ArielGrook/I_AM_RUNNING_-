// NOTE: Run `npm install @codemirror/view @codemirror/state codemirror @codemirror/lang-javascript @codemirror/lang-css @codemirror/lang-html @codemirror/lang-json @codemirror/theme-one-dark` if not already installed
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { EditorState, Compartment, StateField, StateEffect } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
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
  Sun,
  Moon,
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

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'tool_call' | 'tool_result' | 'deploy' | 'error' | 'status';
  content: string;
  full?: string;
  time: string;
}

interface CodeSelection {
  text: string;
  fromLine: number;
  toLine: number;
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
// HELPERS
// ─────────────────────────────────────────────

function getLanguageExtension(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return javascript({ typescript: ext === 'ts' || ext === 'tsx', jsx: ext === 'tsx' || ext === 'jsx' });
    case 'css':
      return css();
    case 'html':
      return html();
    case 'json':
      return json();
    default:
      return javascript();
  }
}

function msgId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─────────────────────────────────────────────
// КОМПОНЕНТ
// ─────────────────────────────────────────────

export default function DevConsolePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem('admin_session');
    if (session !== 'true') {
      router.replace(`/${locale}/admin`);
    } else {
      setHasSession(true);
    }
  }, [locale, router]);

  // ── CORE STATE ──
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('claude');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [tokens, setTokens] = useState<{ input: number; output: number } | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(false);

  // ── CHAT ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedMsgs, setExpandedMsgs] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── FILE TREE ──
  const [showFileTree, setShowFileTree] = useState(true);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [fileTreeLoading, setFileTreeLoading] = useState(false);
  const [fileTreeError, setFileTreeError] = useState<string | null>(null);
  const [fileTreeExpanded, setFileTreeExpanded] = useState<Set<string>>(
    new Set(['app', 'lib', 'components', 'context-core'])
  );

  // ── CODE VIEWER ──
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLines, setFileLines] = useState(0);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [codeSelection, setCodeSelection] = useState<CodeSelection | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const langCompartment = useRef(new Compartment());

  // ── THEME ──
  const [isDark, setIsDark] = useState(true);

  // ── SETTINGS ──
  const [showSettings, setShowSettings] = useState(false);
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

  // ── PORTRAIT WARNING (mobile) ──
  const [isPortrait, setIsPortrait] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // ── EFFECTS ──

  // Theme persistence
  useEffect(() => {
    const stored = localStorage.getItem('devConsoleTheme');
    if (stored === 'light') setIsDark(false);
  }, []);

  // Portrait detection
  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Provider → first model
  useEffect(() => {
    const models = PROVIDERS[provider]?.models;
    if (models?.length) setModel(models[0].value);
  }, [provider]);

  // Settings load
  useEffect(() => {
    if (showSettings) loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings]);

  // File tree auto-load
  useEffect(() => {
    if (hasSession) loadFileTree();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  // Fetch file content
  useEffect(() => {
    if (!selectedFile) return;
    const controller = new AbortController();
    setFileLoading(true);
    setFileError(null);
    setFileContent(null);
    setCodeSelection(null);
    fetch(`/api/dev-agent/files/read?path=${encodeURIComponent(selectedFile)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFileError(data.error); return; }
        setFileContent(data.content);
        setFileLines(data.lines);
      })
      .catch(e => { if (e.name !== 'AbortError') setFileError(e.message); })
      .finally(() => setFileLoading(false));
    return () => controller.abort();
  }, [selectedFile]);

  // Mount/update CodeMirror
  useEffect(() => {
    if (!editorContainerRef.current) return;
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }
    if (!fileContent && fileContent !== '') return;

    const themeExt = isDark ? oneDark : EditorView.baseTheme({});
    const langExt = selectedFile ? getLanguageExtension(selectedFile) : javascript();

    const view = new EditorView({
      state: EditorState.create({
        doc: fileContent ?? '',
        extensions: [
          basicSetup,
          EditorState.readOnly.of(true),
          themeCompartment.current.of(themeExt),
          langCompartment.current.of(langExt),
          EditorView.updateListener.of(update => {
            const sel = update.state.selection.main;
            if (!sel.empty) {
              const fromLine = update.state.doc.lineAt(sel.from).number;
              const toLine = update.state.doc.lineAt(sel.to).number;
              const text = update.state.sliceDoc(sel.from, sel.to);
              setCodeSelection({ text, fromLine, toLine });
            } else {
              setCodeSelection(null);
            }
          }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;
    return () => { view.destroy(); editorViewRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileContent, isDark, selectedFile]);

  // ── SETTINGS ──
  async function loadSettings() {
    try {
      const res = await fetch('/api/dev-agent/config');
      const data = await res.json();
      if (data.config) setConfigMasked(data.config);
    } catch (err) { console.error(err); }
  }

  async function saveSettings() {
    setIsSavingConfig(true);
    setConfigSaved(false);
    try {
      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(configValues)) {
        if (value.trim()) payload[key] = value.trim();
      }
      if (!Object.keys(payload).length) { setIsSavingConfig(false); return; }
      const res = await fetch('/api/dev-agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setConfigMasked(data.config);
        setConfigValues({ anthropicApiKey: '', openaiApiKey: '', geminiApiKey: '', deepseekApiKey: '', githubToken: '', githubRepo: '', developerUserId: '' });
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      }
    } catch (err) { console.error(err); }
    finally { setIsSavingConfig(false); }
  }

  // ── EXECUTE ──
  async function handleExecute() {
    if (!prompt.trim() || isRunning) return;

    const userMsg: ChatMessage = { id: msgId(), type: 'user', content: prompt, time: new Date().toLocaleTimeString('en-GB') };
    setMessages(prev => [...prev, userMsg]);

    const sentPrompt = prompt;
    setPrompt('');
    setIsRunning(true);
    setTokens(null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/dev-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sentPrompt, provider, model, autoDeploy }),
        signal: abortRef.current.signal,
      });
      const data: DevAgentResponse = await response.json();

      const logMsgs: ChatMessage[] = (data.log || []).map(entry => ({
        id: msgId(),
        type: entry.type === 'ai_text' ? 'ai' : entry.type as ChatMessage['type'],
        content: entry.message,
        full: entry.full,
        time: entry.time,
      }));

      const aiMsgs: ChatMessage[] = (data.aiOutputs || []).map(text => ({
        id: msgId(),
        type: 'ai' as const,
        content: text,
        time: new Date().toLocaleTimeString('en-GB'),
      }));

      setMessages(prev => [...prev, ...logMsgs, ...aiMsgs]);
      setTokens(data.tokens);

      if (!data.success) {
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: data.error || 'Unknown error', time: new Date().toLocaleTimeString('en-GB') }]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: 'Aborted by user', time: new Date().toLocaleTimeString('en-GB') }]);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: msg, time: new Date().toLocaleTimeString('en-GB') }]);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }

  function handleStop() { abortRef.current?.abort(); }

  async function handleRollback() {
    if (isRollingBack) return;
    if (!window.confirm('This will revert the last commit, rebuild, and restart. Continue?')) return;
    setIsRollingBack(true);
    try {
      const response = await fetch('/api/dev-agent/rollback', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev,
          { id: msgId(), type: 'status', content: `Rolled back to ${data.revertedTo || 'previous commit'}`, time: new Date().toLocaleTimeString('en-GB') },
          { id: msgId(), type: 'deploy', content: '✅ Rollback complete. Site rebuilt and restarted.', time: new Date().toLocaleTimeString('en-GB') },
        ]);
      } else {
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: data.error || 'Rollback failed', time: new Date().toLocaleTimeString('en-GB') }]);
      }
    } catch (err: unknown) {
      setMessages(prev => [...prev, { id: msgId(), type: 'error', content: err instanceof Error ? err.message : String(err), time: new Date().toLocaleTimeString('en-GB') }]);
    } finally { setIsRollingBack(false); }
  }

  async function handleDeploy() {
    if (isDeploying) return;
    setIsDeploying(true);
    try {
      const response = await fetch('/api/dev-agent/deploy', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: msgId(), type: 'deploy', content: '✅ Deploy complete', time: new Date().toLocaleTimeString('en-GB') }]);
      } else {
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: data.error || 'Deploy failed', time: new Date().toLocaleTimeString('en-GB') }]);
      }
    } catch (err: unknown) {
      setMessages(prev => [...prev, { id: msgId(), type: 'error', content: err instanceof Error ? err.message : String(err), time: new Date().toLocaleTimeString('en-GB') }]);
    } finally { setIsDeploying(false); }
  }

  // ── FILE TREE ──
  const loadFileTree = async () => {
    setFileTreeLoading(true);
    setFileTreeError(null);
    try {
      const res = await fetch('/api/dev-agent/files');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFileTree(data.tree || []);
    } catch (err: unknown) {
      setFileTreeError(err instanceof Error ? err.message : String(err));
    } finally { setFileTreeLoading(false); }
  };

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
    setPrompt(before + prefix + filePath + after);
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

  const handleFileClick = (node: TreeNode) => {
    if (node.type === 'dir') { toggleFolder(node.path); return; }
    setSelectedFile(node.path);
  };

  const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map(node => {
      const isExpanded = fileTreeExpanded.has(node.path);
      const indent = depth * 16;
      const isActive = selectedFile === node.path;
      if (node.type === 'dir') {
        return (
          <div key={node.path}>
            <button
              onClick={() => handleFileClick(node)}
              className={`w-full text-left text-xs py-0.5 rounded transition-colors flex items-center gap-1.5 group ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
              style={{ paddingLeft: `${8 + indent}px` }}
              title={node.path}
            >
              <span className={`w-3 flex-shrink-0 text-center ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{isExpanded ? '▾' : '▸'}</span>
              <span className="text-base leading-none flex-shrink-0">📁</span>
              <span className={`truncate ${isDark ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-900'}`}>{node.name}</span>
            </button>
            {isExpanded && node.children && <div>{renderTree(node.children, depth + 1)}</div>}
          </div>
        );
      }
      return (
        <button
          key={node.path}
          onClick={() => handleFileClick(node)}
          className={`w-full text-left text-xs py-0.5 rounded transition-colors flex items-center gap-1.5 group ${isActive ? (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700') : (isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100')}`}
          style={{ paddingLeft: `${8 + indent}px` }}
          title={`Click to view: ${node.path}`}
        >
          <span className="w-3 flex-shrink-0" />
          <span className="text-base leading-none flex-shrink-0">📄</span>
          <span className={`truncate ${isActive ? '' : (isDark ? 'text-zinc-300 group-hover:text-orange-400' : 'text-zinc-600 group-hover:text-orange-600')}`}>{node.name}</span>
        </button>
      );
    });

  // ── REFERENCE INSERT ──
  const insertReference = () => {
    if (!codeSelection || !selectedFile) return;
    const ref = `File: ${selectedFile}, Lines ${codeSelection.fromLine}-${codeSelection.toLine}:\n\`\`\`\n${codeSelection.text}\n\`\`\``;
    const textarea = textareaRef.current;
    if (textarea) {
      const pos = textarea.selectionStart ?? prompt.length;
      const before = prompt.slice(0, pos);
      const after = prompt.slice(pos);
      const prefix = before && !before.endsWith('\n') ? '\n' : '';
      setPrompt(before + prefix + ref + '\n' + after);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = pos + prefix.length + ref.length + 1;
        textarea.focus();
      });
    } else {
      setPrompt(prev => prev + (prev ? '\n' : '') + ref + '\n');
    }
    setCodeSelection(null);
  };

  // ── THEME ──
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('devConsoleTheme', next ? 'dark' : 'light');
  };

  // ── TOGGLE MSG EXPAND ──
  const toggleMsg = (id: string) => {
    setExpandedMsgs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── RENDER ──
  if (!hasSession) return null;

  const dark = isDark;
  const bg = dark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900';
  const panelBg = dark ? 'bg-zinc-900' : 'bg-zinc-50';
  const borderCls = dark ? 'border-zinc-800' : 'border-zinc-200';
  const inputCls = dark
    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-orange-500'
    : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-orange-500';
  const selectCls = `px-3 py-1.5 rounded-md text-sm border focus:outline-none ${inputCls}`;

  return (
    <div className={`min-h-screen flex flex-col ${bg}`}>
      {/* Portrait warning on mobile */}
      {isPortrait && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center text-sm py-2 font-medium">
          Rotate to landscape for best experience
        </div>
      )}

      {/* Header */}
      <header className={`border-b ${borderCls} px-4 py-2 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/${locale}/admin`)} className={`${dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'} transition-colors`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Terminal className="w-4 h-4 text-orange-500" />
          <h1 className="text-base font-semibold">Dev Console</h1>
        </div>
        <div className="flex items-center gap-2">
          {tokens && (
            <div className={`flex items-center gap-1 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <DollarSign className="w-3 h-3" />
              <span>{tokens.input.toLocaleString()} / {tokens.output.toLocaleString()}</span>
            </div>
          )}
          <button
            onClick={() => setShowFileTree(p => !p)}
            className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${showFileTree ? 'bg-orange-500 text-white' : (dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200')}`}
            title="Toggle file tree"
          >📁</button>
          <button onClick={toggleTheme} className={`p-1.5 rounded transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`} title={dark ? 'Switch to light' : 'Switch to dark'}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowSettings(true)} className={`p-1.5 rounded transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettings(false)} />
          <div className={`relative w-full max-w-md ${panelBg} border-l ${borderCls} overflow-y-auto`}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button onClick={() => setShowSettings(false)} className={dark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'}>✕</button>
              </div>
              <p className={`text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>API keys are stored on the server. Leave fields empty to keep current values.</p>
              {([
                ['anthropicApiKey', 'Anthropic API Key', 'sk-ant-...'],
                ['openaiApiKey', 'OpenAI API Key', 'sk-...'],
                ['deepseekApiKey', 'DeepSeek API Key', 'sk-...'],
                ['geminiApiKey', 'Gemini API Key', 'AIza...'],
              ] as [keyof typeof configValues, string, string][]).map(([key, label, ph]) => (
                <div key={key}>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</label>
                  <input type="password" value={configValues[key]} onChange={e => setConfigValues(p => ({ ...p, [key]: e.target.value }))} placeholder={configMasked[key] || ph}
                    className={`w-full px-3 py-2 rounded-md text-sm border focus:outline-none ${inputCls}`} />
                </div>
              ))}
              <div className={`border-t ${borderCls}`} />
              {([
                ['githubToken', 'GitHub Token', 'ghp_...'],
                ['githubRepo', 'GitHub Repo URL', 'https://github.com/user/repo.git'],
                ['developerUserId', 'Developer User ID', 'uuid-from-supabase'],
              ] as [keyof typeof configValues, string, string][]).map(([key, label, ph]) => (
                <div key={key}>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</label>
                  <input type={key === 'githubToken' ? 'password' : 'text'} value={configValues[key]} onChange={e => setConfigValues(p => ({ ...p, [key]: e.target.value }))} placeholder={configMasked[key] || ph}
                    className={`w-full px-3 py-2 rounded-md text-sm border focus:outline-none ${inputCls}`} />
                </div>
              ))}
              <Button onClick={saveSettings} className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={isSavingConfig}>
                {isSavingConfig ? 'Saving...' : configSaved ? '✓ Saved' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Three-panel layout */}
      <div className="flex-1 flex flex-row overflow-hidden">

        {/* LEFT: File Tree */}
        {showFileTree && (
          <div className={`w-[280px] min-w-[280px] ${panelBg} border-r ${borderCls} flex flex-col overflow-hidden`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${borderCls} flex-shrink-0`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Files</span>
              <button onClick={loadFileTree} disabled={fileTreeLoading} className={`text-xs transition-colors disabled:opacity-40 ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`} title="Refresh">
                {fileTreeLoading ? '⟳' : '↻'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {fileTreeLoading && fileTree.length === 0 && (
                <div className={`px-4 py-3 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Loading files...</div>
              )}
              {fileTreeError && (
                <div className="px-3 py-2 space-y-1">
                  <p className="text-xs text-red-400">{fileTreeError}</p>
                  <button onClick={loadFileTree} className="text-xs text-orange-400 underline">Retry</button>
                </div>
              )}
              {!fileTreeLoading && !fileTreeError && fileTree.length === 0 && (
                <div className={`px-4 py-3 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>No files found.</div>
              )}
              {fileTree.length > 0 && <div className="space-y-0.5 pr-1">{renderTree(fileTree)}</div>}
            </div>
          </div>
        )}

        {/* CENTER: Code Viewer — hidden on mobile */}
        <div className={`hidden md:flex flex-col flex-1 border-r ${borderCls} overflow-hidden min-w-0`}>
          {/* Viewer header */}
          <div className={`flex items-center justify-between px-3 py-2 border-b ${borderCls} flex-shrink-0`}>
            <div className="flex items-center gap-2 min-w-0">
              {selectedFile ? (
                <>
                  <span className={`text-xs font-mono truncate ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>{selectedFile}</span>
                  <span className={`text-xs flex-shrink-0 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>· {fileLines} lines</span>
                </>
              ) : (
                <span className={`text-xs ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>Code Viewer</span>
              )}
            </div>
            {codeSelection && selectedFile && (
              <button
                onClick={insertReference}
                className="flex-shrink-0 px-2 py-0.5 text-xs rounded bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                title="Insert as reference into prompt"
              >
                📎 Reference ({codeSelection.fromLine}–{codeSelection.toLine})
              </button>
            )}
          </div>

          {/* Viewer body */}
          <div className="flex-1 overflow-hidden relative">
            {!selectedFile && (
              <div className={`absolute inset-0 flex items-center justify-center text-sm ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Click a file to view its contents
              </div>
            )}
            {fileLoading && selectedFile && (
              <div className={`absolute inset-0 flex items-center justify-center text-sm ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading {selectedFile}...
              </div>
            )}
            {fileError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-400 text-sm px-4 text-center">{fileError}</div>
              </div>
            )}
            <div ref={editorContainerRef} className="absolute inset-0 overflow-auto" />
          </div>
        </div>

        {/* RIGHT: Chat UI */}
        <div className={`flex flex-col w-full md:w-[400px] md:min-w-[340px] overflow-hidden`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className={`text-xs text-center py-8 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Start a conversation with the AI agent
              </div>
            )}
            {messages.map(msg => {
              const isExpanded = expandedMsgs.has(msg.id);
              const hasMore = msg.full && msg.full.length > msg.content.length;

              if (msg.type === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className={`max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm ${dark ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-200 text-zinc-900'}`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 text-right ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'ai') {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className={`max-w-[90%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm ${dark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Bot className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        <span className="text-xs text-purple-400 font-medium">AI</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              if (msg.type === 'tool_call') {
                return (
                  <div key={msg.id} className={`flex items-start gap-2 text-xs ${dark ? 'text-blue-400' : 'text-blue-600'}`}>
                    <Wrench className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <button
                      onClick={() => hasMore && toggleMsg(msg.id)}
                      className={`text-left break-all ${hasMore ? 'cursor-pointer hover:opacity-80' : ''}`}
                    >
                      {msg.content}
                      {hasMore && !isExpanded && <span className={`ml-1 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>▸</span>}
                    </button>
                  </div>
                );
              }

              if (msg.type === 'tool_result') {
                const lines = msg.content.split('\n');
                const preview = isExpanded ? msg.content : lines.slice(0, 3).join('\n') + (lines.length > 3 ? '...' : '');
                return (
                  <div key={msg.id} className={`text-xs ${dark ? 'text-green-400' : 'text-green-700'}`}>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <button onClick={() => toggleMsg(msg.id)} className="text-left break-all hover:opacity-80 cursor-pointer">
                        <span className="font-mono">{preview}</span>
                        {lines.length > 3 && (
                          <span className={`ml-1 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>{isExpanded ? '▴ collapse' : `▸ +${lines.length - 3} lines`}</span>
                        )}
                      </button>
                    </div>
                    {isExpanded && msg.full && (
                      <pre className={`mt-1 ml-4 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto ${dark ? 'bg-zinc-950 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
                        {msg.full}
                      </pre>
                    )}
                  </div>
                );
              }

              if (msg.type === 'deploy') {
                return (
                  <div key={msg.id} className="flex items-center gap-1.5 text-xs text-yellow-400">
                    <Play className="w-3 h-3" />
                    <span>{msg.content}</span>
                  </div>
                );
              }

              if (msg.type === 'error') {
                return (
                  <div key={msg.id} className="flex items-start gap-1.5 text-xs text-red-400">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{msg.content}</span>
                  </div>
                );
              }

              // status
              return (
                <div key={msg.id} className={`text-xs flex items-center gap-1.5 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <Loader2 className="w-3 h-3" />
                  <span>{msg.content}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className={`border-t ${borderCls} p-3 space-y-2 flex-shrink-0`}>
            {/* Model row */}
            <div className="flex items-center gap-2 flex-wrap">
              <select value={provider} onChange={e => setProvider(e.target.value)} className={selectCls} disabled={isRunning}>
                {Object.entries(PROVIDERS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
              <select value={model} onChange={e => setModel(e.target.value)} className={selectCls} disabled={isRunning}>
                {PROVIDERS[provider]?.models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the task for the AI agent... (Ctrl+Enter to send)"
              disabled={isRunning}
              rows={3}
              style={{ maxHeight: '200px' }}
              className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none resize-y ${inputCls}`}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleExecute(); }
              }}
            />

            {/* Buttons row */}
            <div className="flex items-center gap-2 flex-wrap">
              {isRunning ? (
                <Button onClick={handleStop} variant="outline" size="sm" className="border-red-700 text-red-400 hover:bg-red-950">
                  <Square className="w-3 h-3 mr-1" /> Stop
                </Button>
              ) : (
                <Button onClick={handleExecute} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={!prompt.trim()}>
                  <Play className="w-3 h-3 mr-1" /> Send
                </Button>
              )}
              <Button onClick={handleDeploy} disabled={isRunning || isDeploying} variant="outline" size="sm" className={`border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white`}>
                {isDeploying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                🚀 Deploy
              </Button>
              <Button onClick={handleRollback} variant="outline" size="sm" className={`${dark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-500 hover:bg-zinc-100'}`} disabled={isRollingBack}>
                <RotateCcw className={`w-3 h-3 mr-1 ${isRollingBack ? 'animate-spin' : ''}`} />
                Rollback
              </Button>
              <label className={`flex items-center gap-1.5 text-xs cursor-pointer ml-auto ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <input type="checkbox" checked={autoDeploy} onChange={e => setAutoDeploy(e.target.checked)} className="w-3 h-3" />
                Auto-deploy
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
