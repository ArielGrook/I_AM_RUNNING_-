// NOTE: Run `npm install @codemirror/view @codemirror/state codemirror @codemirror/lang-javascript @codemirror/lang-css @codemirror/lang-html @codemirror/lang-json @codemirror/theme-one-dark` if not already installed
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
  Eye,
  Pencil,
  Save,
  Trash2,
  Plus,
  X,
  Copy,
  FolderPlus,
  GitCommit,
  RefreshCw,
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

interface GitCommitEntry {
  hash: string;
  message: string;
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
  const searchParams = useSearchParams();
  const locale = params?.locale || 'en';

  // When Dev Console is opened from /admin/iam-clients-os (the product admin
  // page redirects here instead of having its own editor), we show a small
  // badge + back-button so the user can return with one click.
  const fromParam = searchParams?.get('from') || '';
  const isFromIamClientsOs = fromParam === 'iam-clients-os';

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
  const readOnlyCompartment = useRef(new Compartment());

  // ── EDIT MODE ──
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const originalContentRef = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [aiUpdateToast, setAiUpdateToast] = useState(false);
  // Discard confirmation modal
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingFileSwitch, setPendingFileSwitch] = useState<TreeNode | null>(null);
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // New file input
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileError, setNewFileError] = useState<string | null>(null);

  // ── CONTEXT MENU ──
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'file' | 'dir' | 'empty';
    path: string;
  } | null>(null);
  // Context menu create (file or folder)
  const [showContextCreateModal, setShowContextCreateModal] = useState(false);
  const [contextCreateType, setContextCreateType] = useState<'file' | 'folder'>('file');
  const [contextCreateParent, setContextCreateParent] = useState('');
  const [contextCreateName, setContextCreateName] = useState('');
  const [contextCreateError, setContextCreateError] = useState<string | null>(null);
  const [isContextCreating, setIsContextCreating] = useState(false);
  // Delete folder confirmation
  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false);
  const [deleteFolderPath, setDeleteFolderPath] = useState<string | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [deleteFolderError, setDeleteFolderError] = useState<string | null>(null);

  // ── PANEL RESIZE ──
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === 'undefined') return 280;
    return parseInt(localStorage.getItem('devConsole_leftWidth') || '280', 10);
  });
  const [rightWidth, setRightWidth] = useState(() => {
    if (typeof window === 'undefined') return 400;
    return parseInt(localStorage.getItem('devConsole_rightWidth') || '400', 10);
  });
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // ── GIT HISTORY ──
  const [gitCommits, setGitCommits] = useState<GitCommitEntry[]>([]);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const [showGitPanel, setShowGitPanel] = useState(true);
  const [gitPanelHeight, setGitPanelHeight] = useState(() => {
    if (typeof window === 'undefined') return 200;
    return parseInt(localStorage.getItem('devConsole_gitPanelHeight') || '200', 10);
  });
  const [gitDragging, setGitDragging] = useState(false);
  const gitDragStartY = useRef(0);
  const gitDragStartHeight = useRef(0);
  const [rollbackTarget, setRollbackTarget] = useState<GitCommitEntry | null>(null);
  const [isRollingBackFromHistory, setIsRollingBackFromHistory] = useState(false);

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

  // ── MOBILE ──
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<'files' | 'git' | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── EFFECTS ──

  // Context menu dismiss: click outside, Escape, scroll
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById('context-menu');
      if (menu && menu.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('scroll', () => setContextMenu(null), true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('scroll', () => setContextMenu(null), true);
      document.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  // Theme persistence
  useEffect(() => {
    const stored = localStorage.getItem('devConsoleTheme');
    if (stored === 'light') setIsDark(false);
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
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

  // Git log auto-load
  useEffect(() => {
    if (hasSession) loadGitLog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  // Panel drag — horizontal (left / right)
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      if (dragging === 'left') {
        setLeftWidth(Math.max(200, Math.min(600, dragStartWidth.current + delta)));
      } else {
        setRightWidth(Math.max(300, Math.min(800, dragStartWidth.current - delta)));
      }
    };
    const onUp = () => setDragging(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging]);

  // Git panel drag — vertical
  useEffect(() => {
    if (!gitDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = gitDragStartY.current - e.clientY;
      setGitPanelHeight(Math.max(100, Math.min(400, gitDragStartHeight.current + delta)));
    };
    const onUp = () => setGitDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [gitDragging]);

  // Persist panel widths/heights
  useEffect(() => { localStorage.setItem('devConsole_leftWidth', String(leftWidth)); }, [leftWidth]);
  useEffect(() => { localStorage.setItem('devConsole_rightWidth', String(rightWidth)); }, [rightWidth]);
  useEffect(() => { localStorage.setItem('devConsole_gitPanelHeight', String(gitPanelHeight)); }, [gitPanelHeight]);

  // Fetch file content
  useEffect(() => {
    if (!selectedFile) return;
    const controller = new AbortController();
    setFileLoading(true);
    setFileError(null);
    setFileContent(null);
    setCodeSelection(null);
    setIsEditMode(false);
    setIsModified(false);
    setSaveError(null);
    fetch(`/api/dev-agent/files/read?path=${encodeURIComponent(selectedFile)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFileError(data.error); return; }
        setFileContent(data.content);
        setFileLines(data.lines);
        originalContentRef.current = data.content;
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
          readOnlyCompartment.current.of(EditorState.readOnly.of(true)),
          themeCompartment.current.of(themeExt),
          langCompartment.current.of(langExt),
          EditorView.updateListener.of(update => {
            // Track modifications
            if (update.docChanged && originalContentRef.current !== null) {
              const current = update.state.doc.toString();
              setIsModified(current !== originalContentRef.current);
            }
            // Track selection
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

  // Reconfigure readOnly when edit mode toggles (no full rebuild)
  useEffect(() => {
    if (!editorViewRef.current) return;
    editorViewRef.current.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(!isEditMode)),
    });
  }, [isEditMode]);

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditMode && selectedFile && !isSaving) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, selectedFile, isSaving]);

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

      // Check for file-modifying tools and reload if current file was modified
      const fileModifyingTools = ['write_file', 'patch_file', 'delete_file'];
      const gitTools = ['git_snapshot'];
      let shouldReloadFile = false;
      let shouldReloadGit = false;
      let shouldReloadTree = false;

      for (const entry of data.log || []) {
        if (entry.type === 'tool_call') {
          const toolName = entry.message.split('(')[0];
          
          if (fileModifyingTools.includes(toolName)) {
            shouldReloadTree = true;
            
            // Parse args to get the path
            try {
              const argsStart = entry.message.indexOf('(');
              const argsEnd = entry.message.lastIndexOf(')');
              if (argsStart !== -1 && argsEnd !== -1) {
                const argsJson = entry.message.substring(argsStart + 1, argsEnd);
                const args = JSON.parse(argsJson);
                const modifiedPath = args.path;
                
                if (modifiedPath && modifiedPath === selectedFile) {
                  shouldReloadFile = true;
                }
              }
            } catch {
              // Failed to parse args, skip
            }
          }
          
          if (gitTools.includes(toolName)) {
            shouldReloadGit = true;
          }
        }
      }

      // Perform reloads
      if (shouldReloadFile) {
        if (isEditMode && isModified) {
          // User has unsaved changes - show warning instead of auto-reload
          setMessages(prev => [...prev, { 
            id: msgId(), 
            type: 'status', 
            content: '⚠️ AI modified this file. You have unsaved changes that may conflict.', 
            time: new Date().toLocaleTimeString('en-GB') 
          }]);
        } else {
          // Safe to reload
          await reloadCurrentFile();
        }
      }
      if (shouldReloadTree) {
        await loadFileTree();
      }
      if (shouldReloadGit) {
        await loadGitLog();
      }

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
        await loadGitLog();
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
        await loadGitLog();
      } else {
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: data.error || 'Deploy failed', time: new Date().toLocaleTimeString('en-GB') }]);
      }
    } catch (err: unknown) {
      setMessages(prev => [...prev, { id: msgId(), type: 'error', content: err instanceof Error ? err.message : String(err), time: new Date().toLocaleTimeString('en-GB') }]);
    } finally { setIsDeploying(false); }
  }

  // ── EDIT MODE HANDLERS ──
  const handleToggleEditMode = () => {
    if (isEditMode && isModified) {
      setPendingFileSwitch(null); // null = toggling mode, not switching file
      setShowDiscardModal(true);
      return;
    }
    setIsEditMode(prev => !prev);
  };

  const handleSave = async () => {
    if (!selectedFile || !editorViewRef.current) return;
    const content = editorViewRef.current.state.doc.toString();
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/dev-agent/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content }),
      });
      const data = await res.json();
      if (data.error) { setSaveError(data.error); return; }
      originalContentRef.current = content;
      setIsModified(false);
      setFileLines(data.lines);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally { setIsSaving(false); }
  };

  const handleDiscardConfirm = () => {
    setIsModified(false);
    if (pendingFileSwitch) {
      // Switching to a different file
      setSelectedFile(pendingFileSwitch.path);
      setPendingFileSwitch(null);
    } else {
      // Just toggling out of edit mode
      setIsEditMode(false);
      // Restore original content in editor
      if (originalContentRef.current !== null && editorViewRef.current) {
        const doc = editorViewRef.current.state.doc.toString();
        if (doc !== originalContentRef.current) {
          editorViewRef.current.dispatch({
            changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: originalContentRef.current },
          });
        }
      }
    }
    setShowDiscardModal(false);
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/dev-agent/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile }),
      });
      const data = await res.json();
      if (data.error) { setSaveError(data.error); return; }
      setSelectedFile(null);
      setFileContent(null);
      setIsEditMode(false);
      setIsModified(false);
      await loadFileTree();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  };

  const handleCreateFile = async () => {
    const p = newFilePath.trim();
    if (!p) return;
    setNewFileError(null);
    try {
      const res = await fetch('/api/dev-agent/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: p, content: '' }),
      });
      const data = await res.json();
      if (data.error) { setNewFileError(data.error); return; }
      setShowNewFileInput(false);
      setNewFilePath('');
      await loadFileTree();
      setSelectedFile(p);
      setIsEditMode(true);
    } catch (err: unknown) {
      setNewFileError(err instanceof Error ? err.message : String(err));
    }
  };

  const reloadCurrentFile = async (filePath?: string) => {
    const pathToReload = filePath || selectedFile;
    if (!pathToReload) return;

    try {
      const res = await fetch(`/api/dev-agent/files/read?path=${encodeURIComponent(pathToReload)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        if (editorViewRef.current) {
          const currentContent = editorViewRef.current.state.doc.toString();
          if (currentContent !== data.content) {
            editorViewRef.current.dispatch({
              changes: { from: 0, to: currentContent.length, insert: data.content }
            });
            originalContentRef.current = data.content;
            setIsModified(false);
            setAiUpdateToast(true);
            setTimeout(() => setAiUpdateToast(false), 2000);
          }
        }
        setFileContent(data.content);
        setFileLines(data.lines);
      }
    } catch {
      // Silently fail - file might have been deleted
    }
  };

  // ── PANEL DRAG HANDLERS ──
  const startDrag = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(side);
    dragStartX.current = e.clientX;
    dragStartWidth.current = side === 'left' ? leftWidth : rightWidth;
  };

  const startGitDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setGitDragging(true);
    gitDragStartY.current = e.clientY;
    gitDragStartHeight.current = gitPanelHeight;
  };

  // ── GIT HISTORY ──
  const loadGitLog = async () => {
    setGitLoading(true);
    setGitError(null);
    try {
      const res = await fetch('/api/dev-agent/git-log');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGitCommits(data.commits || []);
    } catch (err: unknown) {
      setGitError(err instanceof Error ? err.message : String(err));
    } finally {
      setGitLoading(false);
    }
  };

  const handleRollbackFromHistory = async () => {
    if (!rollbackTarget || isRollingBackFromHistory) return;
    setIsRollingBackFromHistory(true);
    try {
      const res = await fetch('/api/dev-agent/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHash: rollbackTarget.hash }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev,
          { id: msgId(), type: 'status', content: `Rolled back to ${rollbackTarget.hash}: ${rollbackTarget.message}`, time: new Date().toLocaleTimeString('en-GB') },
          { id: msgId(), type: 'deploy', content: '✅ Rollback complete. Site rebuilt and restarted.', time: new Date().toLocaleTimeString('en-GB') },
        ]);
        await loadGitLog();
      } else {
        setMessages(prev => [...prev, { id: msgId(), type: 'error', content: data.error || 'Rollback failed', time: new Date().toLocaleTimeString('en-GB') }]);
      }
    } catch (err: unknown) {
      setMessages(prev => [...prev, { id: msgId(), type: 'error', content: err instanceof Error ? err.message : String(err), time: new Date().toLocaleTimeString('en-GB') }]);
    } finally {
      setIsRollingBackFromHistory(false);
      setRollbackTarget(null);
    }
  };

  // ── CONTEXT MENU HANDLERS ──
  const openContextMenu = (e: React.MouseEvent, type: 'file' | 'dir' | 'empty', nodePath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, path: nodePath });
  };

  // ── MOBILE LONG-PRESS HANDLERS ──
  const handleTouchStart = (e: React.TouchEvent, type: 'file' | 'dir' | 'empty', nodePath: string) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ x: touch.clientX, y: touch.clientY, type, path: nodePath });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleDropdown = (panel: 'files' | 'git') => {
    setMobileDropdown(prev => prev === panel ? null : panel);
  };

  const handleContextCreate = async () => {
    const name = contextCreateName.trim();
    if (!name) return;
    setContextCreateError(null);
    setIsContextCreating(true);
    const fullPath = contextCreateParent ? `${contextCreateParent}/${name}` : name;
    try {
      if (contextCreateType === 'file') {
        const res = await fetch('/api/dev-agent/files/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fullPath, content: '' }),
        });
        const data = await res.json();
        if (data.error) { setContextCreateError(data.error); return; }
        await loadFileTree();
        if (contextCreateParent) {
          setFileTreeExpanded(prev => new Set([...prev, contextCreateParent]));
        }
        setSelectedFile(fullPath);
        setIsEditMode(true);
        setShowContextCreateModal(false);
        setContextCreateName('');
      } else {
        const res = await fetch('/api/dev-agent/files/mkdir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fullPath }),
        });
        const data = await res.json();
        if (data.error) { setContextCreateError(data.error); return; }
        await loadFileTree();
        if (contextCreateParent) {
          setFileTreeExpanded(prev => new Set([...prev, contextCreateParent]));
        }
        setFileTreeExpanded(prev => new Set([...prev, fullPath]));
        setShowContextCreateModal(false);
        setContextCreateName('');
      }
    } catch (err: unknown) {
      setContextCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsContextCreating(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderPath) return;
    setIsDeletingFolder(true);
    setDeleteFolderError(null);
    try {
      const res = await fetch('/api/dev-agent/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: deleteFolderPath }),
      });
      const data = await res.json();
      if (data.error) { setDeleteFolderError(data.error); return; }
      await loadFileTree();
      setShowDeleteFolderConfirm(false);
      setDeleteFolderPath(null);
    } catch (err: unknown) {
      setDeleteFolderError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeletingFolder(false);
    }
  };

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
    
    // Mobile: insert path into chat and close dropdown
    if (isMobile) {
      insertPathIntoPrompt(node.path);
      setMobileDropdown(null);
      return;
    }
    
    // Desktop: open in code viewer
    if (isEditMode && isModified && node.path !== selectedFile) {
      setPendingFileSwitch(node);
      setShowDiscardModal(true);
      return;
    }
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
              onContextMenu={(e) => openContextMenu(e, 'dir', node.path)}
              onTouchStart={(e) => handleTouchStart(e, 'dir', node.path)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className={`w-full text-left text-xs rounded transition-colors flex items-center gap-1.5 group ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
              style={{ paddingLeft: `${8 + indent}px`, paddingTop: isMobile ? '10px' : '2px', paddingBottom: isMobile ? '10px' : '2px' }}
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
          onContextMenu={(e) => openContextMenu(e, 'file', node.path)}
          onTouchStart={(e) => handleTouchStart(e, 'file', node.path)}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          className={`w-full text-left text-xs rounded transition-colors flex items-center gap-1.5 group ${isActive ? (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700') : (isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100')}`}
          style={{ paddingLeft: `${8 + indent}px`, paddingTop: isMobile ? '10px' : '2px', paddingBottom: isMobile ? '10px' : '2px' }}
          title={isMobile ? `Tap to insert: ${node.path}` : `Click to view: ${node.path}`}
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
    <div className={`h-[100dvh] overflow-hidden flex flex-col ${bg}`}>
      {/* Header */}
      <header className={`border-b ${borderCls} px-4 py-2 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/${locale}/admin`)} className={`${dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'} transition-colors`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!isMobile && <Terminal className="w-4 h-4 text-orange-500" />}
          <h1 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>Dev Console</h1>
          {isFromIamClientsOs && (
            <button
              onClick={() => router.push(`/${locale}/admin/iam-clients-os`)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${dark ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40' : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'}`}
              title="Return to IAM Clients OS admin"
            >
              ← IAM Clients OS
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isMobile ? (
            <>
              <button
                onClick={() => toggleDropdown('files')}
                className={`p-2 rounded transition-colors ${mobileDropdown === 'files' ? 'bg-orange-500 text-white' : (dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900')}`}
                title="Files"
              >
                📁
              </button>
              <button
                onClick={() => toggleDropdown('git')}
                className={`p-2 rounded transition-colors ${mobileDropdown === 'git' ? 'bg-orange-500 text-white' : (dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900')}`}
                title="Git History"
              >
                📜
              </button>
              <button onClick={toggleTheme} className={`p-2 rounded transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`} title={dark ? 'Switch to light' : 'Switch to dark'}>
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => setShowSettings(true)} className={`p-2 rounded transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettings(false)} />
          <div className={`relative ${isMobile ? 'w-full' : 'w-full max-w-md'} ${panelBg} ${isMobile ? '' : 'border-l'} ${borderCls} overflow-y-auto`}>
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

      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDiscardModal(false)} />
          <div className={`relative rounded-xl p-6 shadow-2xl ${isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80'} ${dark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'}`}>
            <h3 className="text-sm font-semibold mb-2">Unsaved changes</h3>
            <p className={`text-xs mb-5 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              You have unsaved changes. Do you want to discard them?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDiscardModal(false)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${dark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardConfirm}
                className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(false)} />
          <div className={`relative rounded-xl p-6 shadow-2xl ${isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80'} ${dark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'}`}>
            <h3 className="text-sm font-semibold mb-2">Delete file?</h3>
            <p className={`text-xs mb-1 font-mono ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>{selectedFile}</p>
            <p className={`text-xs mb-5 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${dark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          id="context-menu"
          className={`fixed z-[9999] rounded-lg py-1 min-w-[180px] shadow-2xl border ${dark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.type === 'file' && (<>
            <button
              onClick={() => {
                setContextMenu(null);
                const node = { path: contextMenu.path, name: contextMenu.path.split('/').pop() || '', type: 'file' as const };
                handleFileClick(node);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Eye className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> Open
            </button>
            <button
              onClick={() => {
                setContextMenu(null);
                const node = { path: contextMenu.path, name: contextMenu.path.split('/').pop() || '', type: 'file' as const };
                handleFileClick(node);
                setTimeout(() => setIsEditMode(true), 50);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Pencil className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> Open in Edit Mode
            </button>
            <button
              onClick={() => {
                setContextMenu(null);
                navigator.clipboard.writeText(contextMenu.path);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Copy className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> Copy Path
            </button>
            <div className={`my-1 border-t ${dark ? 'border-zinc-700' : 'border-zinc-200'} mx-2`} />
            <button
              onClick={() => {
                setContextMenu(null);
                setSelectedFile(contextMenu.path);
                setShowDeleteConfirm(true);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors text-red-400 ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /> Delete File
            </button>
          </>)}

          {contextMenu.type === 'dir' && (<>
            <button
              onClick={() => {
                setContextMenu(null);
                setContextCreateType('file');
                setContextCreateParent(contextMenu.path);
                setContextCreateName('');
                setContextCreateError(null);
                setShowContextCreateModal(true);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> New File
            </button>
            <button
              onClick={() => {
                setContextMenu(null);
                setContextCreateType('folder');
                setContextCreateParent(contextMenu.path);
                setContextCreateName('');
                setContextCreateError(null);
                setShowContextCreateModal(true);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <FolderPlus className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> New Folder
            </button>
            <div className={`my-1 border-t ${dark ? 'border-zinc-700' : 'border-zinc-200'} mx-2`} />
            <button
              onClick={() => {
                setContextMenu(null);
                setDeleteFolderPath(contextMenu.path);
                setDeleteFolderError(null);
                setShowDeleteFolderConfirm(true);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors text-red-400 ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /> Delete Folder
            </button>
          </>)}

          {contextMenu.type === 'empty' && (<>
            <button
              onClick={() => {
                setContextMenu(null);
                setContextCreateType('file');
                setContextCreateParent('');
                setContextCreateName('');
                setContextCreateError(null);
                setShowContextCreateModal(true);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> New File
            </button>
            <button
              onClick={() => {
                setContextMenu(null);
                setContextCreateType('folder');
                setContextCreateParent('');
                setContextCreateName('');
                setContextCreateError(null);
                setShowContextCreateModal(true);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${dark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
            >
              <FolderPlus className="w-3.5 h-3.5 flex-shrink-0 opacity-70" /> New Folder
            </button>
          </>)}
        </div>
      )}

      {/* Context Create Modal (New File / New Folder) */}
      {showContextCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowContextCreateModal(false)} />
          <div className={`relative rounded-xl p-6 shadow-2xl ${isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80'} ${dark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'}`}>
            <h3 className="text-sm font-semibold mb-1">
              {contextCreateType === 'file' ? '📄 New File' : '📁 New Folder'}
            </h3>
            {contextCreateParent && (
              <p className={`text-xs mb-3 font-mono ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                in {contextCreateParent}/
              </p>
            )}
            <input
              type="text"
              autoFocus
              value={contextCreateName}
              onChange={e => setContextCreateName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleContextCreate();
                if (e.key === 'Escape') { setShowContextCreateModal(false); setContextCreateName(''); }
              }}
              placeholder={contextCreateType === 'file' ? 'filename.ts' : 'folder-name'}
              className={`w-full px-3 py-2 text-sm rounded border mb-3 focus:outline-none ${dark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-orange-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500'}`}
            />
            {contextCreateError && <p className="text-xs text-red-400 mb-3">{contextCreateError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowContextCreateModal(false); setContextCreateName(''); }}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${dark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleContextCreate}
                disabled={isContextCreating || !contextCreateName.trim()}
                className="px-3 py-1.5 text-xs rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white transition-colors"
              >
                {isContextCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      {showDeleteFolderConfirm && deleteFolderPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowDeleteFolderConfirm(false); setDeleteFolderError(null); }} />
          <div className={`relative rounded-xl p-6 shadow-2xl ${isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80'} ${dark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'}`}>
            <h3 className="text-sm font-semibold mb-2">Delete folder?</h3>
            <p className={`text-xs mb-1 font-mono ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>{deleteFolderPath}</p>
            <p className={`text-xs mb-1 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Only empty folders can be deleted.</p>
            {deleteFolderError && <p className="text-xs text-red-400 mb-2">{deleteFolderError}</p>}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => { setShowDeleteFolderConfirm(false); setDeleteFolderError(null); }}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${dark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFolder}
                disabled={isDeletingFolder}
                className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
              >
                {isDeletingFolder ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback from Git History confirmation modal */}
      {rollbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRollbackTarget(null)} />
          <div className={`relative rounded-xl p-6 shadow-2xl ${isMobile ? 'w-[90%] max-w-sm' : 'w-96'} ${dark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'}`}>
            <h3 className="text-sm font-semibold mb-2">Rollback to this commit?</h3>
            <div className={`rounded-lg px-3 py-2 mb-3 ${dark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <p className="font-mono text-xs text-orange-400 mb-0.5">{rollbackTarget.hash}</p>
              <p className={`text-xs ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>{rollbackTarget.message}</p>
            </div>
            <p className={`text-xs mb-5 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              This will run <code className="font-mono">git reset --hard {rollbackTarget.hash}</code>, rebuild, and restart the server. All commits after this point will be discarded.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRollbackTarget(null)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${dark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRollbackFromHistory}
                disabled={isRollingBackFromHistory}
                className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
              >
                {isRollingBackFromHistory ? 'Rolling back...' : 'Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE LAYOUT - Portrait with dropdown panels */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
          {/* Backdrop when dropdown is open */}
          {mobileDropdown && (
            <div
              className="absolute inset-0 bg-black/30 z-10"
              onClick={() => setMobileDropdown(null)}
            />
          )}

          {/* Dropdown Panels */}
          <div
            className={`${panelBg} border-b ${borderCls} overflow-hidden transition-all duration-200 ease-out flex-shrink-0 relative z-20`}
            style={{
              maxHeight: mobileDropdown ? '50vh' : '0',
              overflowY: mobileDropdown ? 'auto' : 'hidden'
            }}
          >
            {mobileDropdown === 'files' && (
              <div className="flex flex-col">
              {/* File Tree Header */}
              <div className={`flex items-center justify-between px-3 py-2 border-b ${borderCls} flex-shrink-0`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Files</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setShowNewFileInput(p => !p); setNewFilePath(''); setNewFileError(null); }}
                    className={`text-xs transition-colors ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`}
                    title="New file"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={loadFileTree} disabled={fileTreeLoading} className={`text-xs transition-colors disabled:opacity-40 ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`} title="Refresh">
                    {fileTreeLoading ? '⟳' : '↻'}
                  </button>
                </div>
              </div>

              {/* New file input */}
              {showNewFileInput && (
                <div className={`px-2 py-2 border-b ${borderCls} flex-shrink-0 space-y-1`}>
                  <input
                    type="text"
                    autoFocus
                    value={newFilePath}
                    onChange={e => setNewFilePath(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateFile();
                      if (e.key === 'Escape') { setShowNewFileInput(false); setNewFilePath(''); setNewFileError(null); }
                    }}
                    placeholder="lib/utils/helper.ts"
                    className={`w-full px-2 py-1 text-xs rounded border focus:outline-none font-mono ${dark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-orange-500' : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-orange-500'}`}
                  />
                  {newFileError && <p className="text-xs text-red-400">{newFileError}</p>}
                  <p className={`text-[10px] ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>Enter to create · Esc to cancel</p>
                </div>
              )}

              {/* File Tree Content */}
              <div
                className="flex-1 overflow-y-auto py-1 min-h-0"
                onContextMenu={(e) => {
                  if (e.target === e.currentTarget) openContextMenu(e, 'empty', '');
                }}
              >
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
                  <div
                    className={`px-4 py-3 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}
                    onContextMenu={(e) => openContextMenu(e, 'empty', '')}
                  >No files found.</div>
                )}
                {fileTree.length > 0 && <div className="space-y-0.5 pr-1">{renderTree(fileTree)}</div>}
              </div>

              </div>
            )}

            {mobileDropdown === 'git' && (
              <div className="flex flex-col">
                <div className={`flex items-center justify-between px-3 py-2 border-b ${borderCls} flex-shrink-0`}>
                  <div className="flex items-center gap-1.5">
                    <GitCommit className={`w-3 h-3 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Git History</span>
                  </div>
                  <button
                    onClick={loadGitLog}
                    disabled={gitLoading}
                    className={`transition-colors disabled:opacity-40 ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`}
                    title="Refresh git log"
                  >
                    <RefreshCw className={`w-3 h-3 ${gitLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="py-1">
                  {gitLoading && gitCommits.length === 0 && (
                    <div className={`px-3 py-2 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Loading...</div>
                  )}
                  {gitError && (
                    <div className="px-3 py-2 space-y-1">
                      <p className="text-xs text-red-400 break-all">{gitError}</p>
                      <button onClick={loadGitLog} className="text-xs text-orange-400 underline">Retry</button>
                    </div>
                  )}
                  {!gitLoading && !gitError && gitCommits.length === 0 && (
                    <div className={`px-3 py-2 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>No commits.</div>
                  )}
                  {gitCommits.map((commit, i) => (
                    <div
                      key={commit.hash}
                      className={`group flex items-center gap-2 px-3 py-2 text-sm transition-colors ${i === 0 ? (dark ? 'bg-orange-500/10' : 'bg-orange-50') : ''} ${dark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                      style={{ minHeight: '44px' }}
                    >
                      <span className={`font-mono flex-shrink-0 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{commit.hash.slice(0, 7)}</span>
                      <span className={`truncate flex-1 text-xs ${dark ? 'text-zinc-300' : 'text-zinc-700'} ${i === 0 ? 'font-medium' : ''}`} title={commit.message}>
                        {commit.message}
                      </span>
                      <button
                        onClick={() => setRollbackTarget(commit)}
                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-2 py-1 rounded ${dark ? 'bg-zinc-700 hover:bg-red-900 text-zinc-300 hover:text-red-300' : 'bg-zinc-200 hover:bg-red-100 text-zinc-600 hover:text-red-600'}`}
                        title={`Rollback to ${commit.hash}`}
                      >
                        ↩
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Area - Always visible */}
          <div className={`flex-1 flex flex-col overflow-hidden ${panelBg} relative z-0`}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
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
                    const preview = isExpanded ? msg.content : lines.slice(0, 2).join('\n') + (lines.length > 2 ? '...' : '');
                    return (
                      <div key={msg.id} className={`text-xs ${dark ? 'text-green-400' : 'text-green-700'}`}>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          <button onClick={() => toggleMsg(msg.id)} className="text-left break-all hover:opacity-80 cursor-pointer">
                            <span className="font-mono">{preview}</span>
                            {lines.length > 2 && (
                              <span className={`ml-1 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>{isExpanded ? '▴' : `▸ +${lines.length - 2}`}</span>
                            )}
                          </button>
                        </div>
                        {isExpanded && msg.full && (
                          <pre className={`mt-1 ml-4 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto ${dark ? 'bg-zinc-950 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
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

                  if (msg.type === 'status') {
                    return (
                      <div key={msg.id} className={`text-xs text-center ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {msg.content}
                      </div>
                    );
                  }

                  return null;
                })}
                <div ref={chatEndRef} />
              </div>

            {/* Input area - Always at bottom */}
            <div className={`border-t ${borderCls} p-3 flex-shrink-0 space-y-2`}>
              {/* Row 1: Model selector + Textarea */}
              <div className="flex items-start gap-2">
                <select
                  value={`${provider}:${model}`}
                  onChange={e => {
                    const [newProvider, newModel] = e.target.value.split(':');
                    setProvider(newProvider);
                    setModel(newModel);
                  }}
                  className={`flex-shrink-0 text-xs ${selectCls}`}
                  style={{ minHeight: '44px' }}
                >
                  {Object.entries(PROVIDERS).map(([providerKey, providerData]) =>
                    providerData.models.map(m => (
                      <option key={`${providerKey}:${m.value}`} value={`${providerKey}:${m.value}`}>
                        {providerData.label} - {m.label}
                      </option>
                    ))
                  )}
                </select>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Enter prompt..."
                  className={`flex-1 px-3 py-2 rounded-md text-sm border focus:outline-none resize-none ${inputCls}`}
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '132px' }}
                  disabled={isRunning}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '44px';
                    target.style.height = Math.min(target.scrollHeight, 132) + 'px';
                  }}
                />
              </div>

              {/* Row 2: Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecute}
                  disabled={isRunning || !prompt.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 rounded-md text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white transition-colors"
                  style={{ minHeight: '48px' }}
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isRunning ? 'Running...' : 'Send'}
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex items-center justify-center gap-1.5 px-3 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white transition-colors"
                  style={{ minHeight: '48px' }}
                  title="Deploy"
                >
                  {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}
                </button>
                <button
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="flex items-center justify-center gap-1.5 px-3 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors"
                  style={{ minHeight: '48px' }}
                  title="Rollback"
                >
                  {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : '↩️'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT - Three-panel layout */
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">

        {/* LEFT: File Tree + Git History */}
        {showFileTree && (
          <div
            className={`${panelBg} border-r ${borderCls} flex flex-col overflow-hidden min-h-0 flex-shrink-0`}
            style={{ width: leftWidth, minWidth: 200, maxWidth: 600 }}
          >
            <div className={`flex items-center justify-between px-3 py-2 border-b ${borderCls} flex-shrink-0`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Files</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setShowNewFileInput(p => !p); setNewFilePath(''); setNewFileError(null); }}
                  className={`text-xs transition-colors ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`}
                  title="New file"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={loadFileTree} disabled={fileTreeLoading} className={`text-xs transition-colors disabled:opacity-40 ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`} title="Refresh">
                  {fileTreeLoading ? '⟳' : '↻'}
                </button>
              </div>
            </div>
            {/* New file input */}
            {showNewFileInput && (
              <div className={`px-2 py-2 border-b ${borderCls} flex-shrink-0 space-y-1`}>
                <input
                  type="text"
                  autoFocus
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFile();
                    if (e.key === 'Escape') { setShowNewFileInput(false); setNewFilePath(''); setNewFileError(null); }
                  }}
                  placeholder="lib/utils/helper.ts"
                  className={`w-full px-2 py-1 text-xs rounded border focus:outline-none font-mono ${dark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-orange-500' : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-orange-500'}`}
                />
                {newFileError && <p className="text-xs text-red-400">{newFileError}</p>}
                <p className={`text-[10px] ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>Enter to create · Esc to cancel</p>
              </div>
            )}
            <div
              className="flex-1 overflow-y-auto py-1 min-h-0"
              onContextMenu={(e) => {
                if (e.target === e.currentTarget) openContextMenu(e, 'empty', '');
              }}
            >
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
                <div
                  className={`px-4 py-3 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}
                  onContextMenu={(e) => openContextMenu(e, 'empty', '')}
                >No files found.</div>
              )}
              {fileTree.length > 0 && <div className="space-y-0.5 pr-1">{renderTree(fileTree)}</div>}
            </div>

            {/* Git History horizontal resize handle */}
            <div
              className={`h-1 flex-shrink-0 cursor-row-resize transition-colors ${dark ? 'hover:bg-zinc-600' : 'hover:bg-zinc-300'} ${gitDragging ? (dark ? 'bg-zinc-600' : 'bg-zinc-300') : 'bg-transparent'}`}
              onMouseDown={startGitDrag}
              title="Drag to resize git panel"
            />

            {/* Git History panel */}
            {showGitPanel && (
              <div
                className={`border-t ${borderCls} flex flex-col overflow-hidden flex-shrink-0`}
                style={{ height: gitPanelHeight }}
              >
                <div className={`flex items-center justify-between px-3 py-1.5 border-b ${borderCls} flex-shrink-0`}>
                  <div className="flex items-center gap-1.5">
                    <GitCommit className={`w-3 h-3 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Git History</span>
                  </div>
                  <button
                    onClick={loadGitLog}
                    disabled={gitLoading}
                    className={`transition-colors disabled:opacity-40 ${dark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-400 hover:text-orange-500'}`}
                    title="Refresh git log"
                  >
                    <RefreshCw className={`w-3 h-3 ${gitLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {gitLoading && gitCommits.length === 0 && (
                    <div className={`px-3 py-2 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Loading...</div>
                  )}
                  {gitError && (
                    <div className="px-3 py-2 space-y-1">
                      <p className="text-xs text-red-400 break-all">{gitError}</p>
                      <button onClick={loadGitLog} className="text-xs text-orange-400 underline">Retry</button>
                    </div>
                  )}
                  {!gitLoading && !gitError && gitCommits.length === 0 && (
                    <div className={`px-3 py-2 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>No commits found.</div>
                  )}
                  {gitCommits.map((commit, i) => (
                    <div
                      key={commit.hash}
                      className={`group flex items-center gap-2 px-3 py-1.5 text-xs cursor-default transition-colors ${i === 0 ? (dark ? 'bg-orange-500/10' : 'bg-orange-50') : ''} ${dark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                    >
                      <span className={`font-mono flex-shrink-0 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{commit.hash.slice(0, 7)}</span>
                      <span className={`truncate flex-1 ${dark ? 'text-zinc-300' : 'text-zinc-700'} ${i === 0 ? 'font-medium' : ''}`} title={commit.message}>
                        {commit.message}
                      </span>
                      <button
                        onClick={() => setRollbackTarget(commit)}
                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-zinc-700 hover:bg-red-900 text-zinc-300 hover:text-red-300' : 'bg-zinc-200 hover:bg-red-100 text-zinc-600 hover:text-red-600'}`}
                        title={`Rollback to ${commit.hash}`}
                      >
                        ↩ rollback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drag handle: left ↔ center */}
        {showFileTree && (
          <div
            className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${dark ? 'hover:bg-zinc-600' : 'hover:bg-zinc-300'} ${dragging === 'left' ? (dark ? 'bg-zinc-600' : 'bg-zinc-300') : 'bg-transparent'}`}
            onMouseDown={(e) => startDrag('left', e)}
            title="Drag to resize"
          />
        )}

        {/* CENTER: Code Viewer — hidden on mobile */}
        <div
          className={`hidden md:flex flex-col border-r ${borderCls} overflow-hidden min-h-0`}
          style={{ flex: 1, minWidth: 300 }}
        >
          {/* Viewer header */}
          <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${borderCls} flex-shrink-0 flex-wrap`}>
            {/* File path + modified badge */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {selectedFile ? (
                <>
                  <span className={`text-xs font-mono truncate ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>{selectedFile}</span>
                  <span className={`text-xs flex-shrink-0 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>· {fileLines}L</span>
                  {isModified && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Modified
                    </span>
                  )}
                </>
              ) : (
                <span className={`text-xs ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>Code Viewer</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Reference button */}
              {codeSelection && selectedFile && (
                <button
                  onClick={insertReference}
                  className="px-2 py-0.5 text-xs rounded bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                  title="Insert as reference into prompt"
                >
                  📎 {codeSelection.fromLine}–{codeSelection.toLine}
                </button>
              )}

              {/* Save / Discard (edit mode only) */}
              {isEditMode && selectedFile && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !isModified}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white transition-colors"
                    title="Save (Ctrl+S)"
                  >
                    <Save className="w-3 h-3" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleToggleEditMode}
                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${dark ? 'text-zinc-400 hover:bg-zinc-700' : 'text-zinc-500 hover:bg-zinc-100'}`}
                    title="Discard changes"
                  >
                    <X className="w-3 h-3" /> Discard
                  </button>
                </>
              )}

              {/* View / Edit toggle */}
              {selectedFile && (
                <button
                  onClick={handleToggleEditMode}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${isEditMode ? 'bg-orange-500 text-white' : (dark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100')}`}
                  title={isEditMode ? 'Switch to View mode' : 'Switch to Edit mode'}
                >
                  {isEditMode ? <Eye className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                  {isEditMode ? 'View' : 'Edit'}
                </button>
              )}

              {/* Delete */}
              {selectedFile && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`p-1 rounded transition-colors text-red-400 hover:bg-red-950 hover:text-red-300`}
                  title={`Delete ${selectedFile}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Save error bar */}
          {saveError && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/50 border-b border-red-800 flex-shrink-0">
              <span className="text-xs text-red-300">{saveError}</span>
              <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-200"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Save toast */}
          {saveToast && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-green-700 text-white text-sm shadow-lg pointer-events-none">
              ✓ Saved
            </div>
          )}

          {/* AI update toast */}
          {aiUpdateToast && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm shadow-lg pointer-events-none">
              ✓ File updated by AI
            </div>
          )}

          {/* Viewer body */}
          <div className="flex-1 overflow-hidden relative min-h-0">
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

        {/* Drag handle: center ↔ right */}
        <div
          className={`hidden md:block w-1 flex-shrink-0 cursor-col-resize transition-colors ${dark ? 'hover:bg-zinc-600' : 'hover:bg-zinc-300'} ${dragging === 'right' ? (dark ? 'bg-zinc-600' : 'bg-zinc-300') : 'bg-transparent'}`}
          onMouseDown={(e) => startDrag('right', e)}
          title="Drag to resize"
        />

        {/* RIGHT: Chat UI */}
        <div
          className={`flex flex-col overflow-hidden min-h-0 flex-shrink-0`}
          style={{ width: rightWidth, minWidth: 300, maxWidth: 800 }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
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
      )}
    </div>
  );
}
