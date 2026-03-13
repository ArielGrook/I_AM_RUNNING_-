import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';
import { executeTool } from '@/lib/dev-agent/tool-executor';
import { getProvider, type AIMessage } from '@/lib/dev-agent/ai-provider';
import { loadConfig } from '@/lib/dev-agent/config';

// Разрешить длительное выполнение (build может занять 60+ секунд)
export const maxDuration = 120;
export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;
const PM2_PROCESS_NAME = process.env.PM2_PROCESS_NAME || 'I-AM-RUNNING';
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';
const MAX_TOOL_ITERATIONS = 25;
const CONTEXT_CORE_DIR = join(PROJECT_ROOT, 'context-core');

// ─────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────

interface LogEntry {
  time: string;
  type: 'status' | 'tool_call' | 'tool_result' | 'ai_text' | 'deploy' | 'error';
  message: string;
  full?: string;
}

interface DevAgentRequest {
  prompt: string;
  provider: string;  // 'claude' | 'openai' | 'deepseek'
  model: string;     // конкретная модель
  autoDeploy?: boolean; // по умолчанию true
}

interface DevAgentResponse {
  success: boolean;
  log: LogEntry[];
  finalText: string | null;
  aiOutputs: string[];
  tokens: { input: number; output: number };
  error?: string;
}

// ─────────────────────────────────────────────
// УТИЛИТЫ
// ─────────────────────────────────────────────

function timestamp(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

/**
 * Загрузить все .md файлы из context-core/ и собрать system prompt
 */
async function loadContextCore(): Promise<string> {
  try {
    const files = await readdir(CONTEXT_CORE_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort();

    if (mdFiles.length === 0) {
      return 'No context-core files found. Work with the project as-is.';
    }

    const parts: string[] = [];
    for (const file of mdFiles) {
      const content = await readFile(join(CONTEXT_CORE_DIR, file), 'utf-8');
      parts.push(`# --- ${file} ---\n${content}`);
    }

    return parts.join('\n\n');
  } catch {
    return 'context-core directory not found. Work with the project as-is.';
  }
}

/**
 * Выполнить deploy: git commit, push, build, pm2 restart
 */
function deploy(log: LogEntry[], summary: string): { success: boolean; error?: string } {
  const run = (cmd: string, label: string): boolean => {
    try {
      log.push({ time: timestamp(), type: 'deploy', message: `${label}...` });
      execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000 });
      log.push({ time: timestamp(), type: 'deploy', message: `${label} ✅` });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.push({ time: timestamp(), type: 'error', message: `${label} FAILED: ${message}` });
      return false;
    }
  };

  // Git add + commit
  try {
    execSync('git add -A', { cwd: PROJECT_ROOT, timeout: 10000 });
    execSync('git diff --cached --quiet', { cwd: PROJECT_ROOT, timeout: 5000 });
    // Если не выбросил — изменений нет
    log.push({ time: timestamp(), type: 'deploy', message: 'No changes to commit' });
  } catch {
    // Есть изменения — коммитим
    const commitMsg = `dev-agent: ${summary.replace(/"/g, '\\"').substring(0, 100)}`;
    if (!run(`git commit -m "${commitMsg}"`, 'git commit')) {
      return { success: false, error: 'git commit failed' };
    }
  }

  // Git push
  if (!run(`git push origin ${GIT_BRANCH}`, 'git push')) {
    return { success: false, error: 'git push failed' };
  }

  // npm run build
  if (!run('npm run build', 'npm run build')) {
    return {
      success: false,
      error: 'Build failed. Changes committed but NOT deployed. Use rollback if needed.',
    };
  }

  // pm2 restart
  if (!run(`pm2 restart ${PM2_PROCESS_NAME}`, 'pm2 restart')) {
    return { success: false, error: 'pm2 restart failed. Build succeeded — try manual restart.' };
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<DevAgentResponse>> {
  const log: LogEntry[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const aiOutputs: string[] = [];

  try {
    // ── AUTH ──
    log.push({ time: timestamp(), type: 'status', message: 'Checking auth...' });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, log, finalText: null, aiOutputs: [], tokens: { input: 0, output: 0 }, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const devConfig = await loadConfig();
    const devUserId = DEVELOPER_USER_ID || devConfig.developerUserId;
    if (devUserId && user.id !== devUserId) {
      return NextResponse.json(
        { success: false, log, finalText: null, aiOutputs: [], tokens: { input: 0, output: 0 }, error: 'Access denied' },
        { status: 403 }
      );
    }

    // ── PARSE REQUEST ──
    const body: DevAgentRequest = await request.json();
    const { prompt, provider: providerName, model, autoDeploy = true } = body;

    if (!prompt || !providerName || !model) {
      return NextResponse.json(
        { success: false, log, finalText: null, aiOutputs: [], tokens: { input: 0, output: 0 }, error: 'Missing prompt, provider, or model' },
        { status: 400 }
      );
    }

    // ── LOAD CONTEXT CORE ──
    log.push({ time: timestamp(), type: 'status', message: 'Loading context-core...' });
    const systemPrompt = await loadContextCore();
    log.push({ time: timestamp(), type: 'status', message: `Context loaded (${systemPrompt.length} chars)` });

    // ── INIT PROVIDER ──
    log.push({ time: timestamp(), type: 'status', message: `Using ${providerName} / ${model}` });
    let apiKey: string | undefined;
    switch (providerName) {
      case 'claude': apiKey = devConfig.anthropicApiKey; break;
      case 'openai': apiKey = devConfig.openaiApiKey; break;
      case 'deepseek': apiKey = devConfig.deepseekApiKey; break;
      case 'gemini': apiKey = devConfig.geminiApiKey; break;
    }
    const provider = getProvider(providerName, apiKey);

    // ── BUILD MESSAGES ──
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    // ── TOOL CALL LOOP ──
    let finalText: string | null = null;
    let iteration = 0;

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;
      log.push({ time: timestamp(), type: 'status', message: `AI call #${iteration}...` });

      const response = await provider.call(messages, model);
      totalInputTokens += response.inputTokens;
      totalOutputTokens += response.outputTokens;

      // Сохранить текстовый ответ
      if (response.text) {
        finalText = response.text;
        aiOutputs.push(response.text);
        log.push({ time: timestamp(), type: 'ai_text', message: response.text.substring(0, 300) + (response.text.length > 300 ? '... (see Output panel)' : '') });
      }

      // Если нет tool calls — модель закончила
      if (response.toolCalls.length === 0) {
        log.push({ time: timestamp(), type: 'status', message: 'AI finished (no more tool calls)' });
        break;
      }

      // Добавить assistant message с tool calls в историю
      messages.push({
        role: 'assistant',
        content: response.text || '',
        toolCalls: response.toolCalls,
      });

      // Исполнить каждый tool call
      for (const toolCall of response.toolCalls) {
        log.push({
          time: timestamp(),
          type: 'tool_call',
          message: `${toolCall.name}(${JSON.stringify(toolCall.args).substring(0, 200)})`,
        });

        const result = await executeTool({ name: toolCall.name, args: toolCall.args });

        const fullResult = result.success ? (result.data || 'OK') : `ERROR: ${result.error}`;
        const shortResult = fullResult.length > 200
          ? fullResult.substring(0, 200) + `... (${fullResult.length} chars total)`
          : fullResult;

        log.push({
          time: timestamp(),
          type: 'tool_result',
          message: shortResult,
          full: fullResult,
        });

        // Добавить tool result в историю для следующего вызова
        messages.push({
          role: 'tool',
          content: result.success ? (result.data || 'OK') : `ERROR: ${result.error}`,
          tool_call_id: toolCall.id,
          name: toolCall.name,
        });
      }
    }

    if (iteration >= MAX_TOOL_ITERATIONS) {
      log.push({
        time: timestamp(),
        type: 'error',
        message: `Stopped: reached ${MAX_TOOL_ITERATIONS} iterations limit`,
      });
    }

    // ── DEPLOY ──
    if (autoDeploy) {
      log.push({ time: timestamp(), type: 'status', message: 'Starting deploy...' });
      const deployResult = deploy(log, finalText?.substring(0, 100) || 'dev-agent changes');

      if (!deployResult.success) {
        return NextResponse.json({
          success: false,
          log,
          finalText,
          aiOutputs,
          tokens: { input: totalInputTokens, output: totalOutputTokens },
          error: deployResult.error,
        });
      }

      log.push({ time: timestamp(), type: 'status', message: '✅ Deploy complete. Check the site.' });
    } else {
      log.push({ time: timestamp(), type: 'status', message: 'Auto-deploy disabled. Changes saved to files only.' });
    }

    // ── RESPONSE ──
    return NextResponse.json({
      success: true,
      log,
      finalText,
      aiOutputs,
      tokens: { input: totalInputTokens, output: totalOutputTokens },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.push({ time: timestamp(), type: 'error', message });
    return NextResponse.json({
      success: false,
      log,
      finalText: null,
      aiOutputs: [],
      tokens: { input: totalInputTokens, output: totalOutputTokens },
      error: message,
    }, { status: 500 });
  }
}
