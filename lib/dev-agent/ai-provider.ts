import { TOOL_DEFINITIONS } from './tool-executor';

// ─────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  // Для tool results (отправка результатов обратно модели)
  tool_call_id?: string;
  name?: string;
  // Для assistant: tool calls которые модель запросила
  toolCalls?: AIToolCall[];
}

export interface AIToolCall {
  id: string;          // уникальный ID вызова (от провайдера)
  name: string;        // имя инструмента (read_file, write_file и т.д.)
  args: Record<string, unknown>; // аргументы
}

export interface AIResponse {
  text: string | null;        // текстовый ответ модели (может быть null если только tool calls)
  toolCalls: AIToolCall[];    // запросы на вызов инструментов
  done: boolean;              // true если модель закончила (нет tool calls)
  inputTokens: number;        // использовано входных токенов
  outputTokens: number;       // использовано выходных токенов
}

export interface AIProvider {
  name: string;
  call(messages: AIMessage[], model: string): Promise<AIResponse>;
}

// ─────────────────────────────────────────────
// CLAUDE (ANTHROPIC) АДАПТЕР
// ─────────────────────────────────────────────

function buildClaudeTools() {
  return TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: tool.parameters.type,
      properties: tool.parameters.properties,
      required: tool.parameters.required,
    },
  }));
}

function buildClaudeMessages(messages: AIMessage[]): {
  system: string;
  messages: Array<{ role: string; content: unknown }>;
} {
  // Отделить system message от остальных
  let system = '';
  const apiMessages: Array<{ role: string; content: unknown }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system += (system ? '\n\n' : '') + msg.content;
      continue;
    }

    if (msg.role === 'tool') {
      // Claude: tool results отправляются как role: 'user' с type: 'tool_result'
      apiMessages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.tool_call_id,
            content: msg.content,
          },
        ],
      });
      continue;
    }

    if (msg.role === 'assistant') {
      // Assistant с toolCalls → content как массив (text block + tool_use blocks)
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        const blocks: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }> = [];
        if (msg.content) {
          blocks.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
        }
        apiMessages.push({ role: 'assistant', content: blocks });
      } else {
        apiMessages.push({ role: 'assistant', content: msg.content });
      }
      continue;
    }

    // user messages
    apiMessages.push({ role: 'user', content: msg.content });
  }

  return { system, messages: apiMessages };
}

export function createClaudeProvider(apiKeyOverride?: string): AIProvider {
  const apiKey = apiKeyOverride || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set. Add it in Dev Console settings.');

  return {
    name: 'claude',

    async call(messages: AIMessage[], model: string): Promise<AIResponse> {
      const { system, messages: apiMessages } = buildClaudeMessages(messages);
      const tools = buildClaudeTools();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 16384,
          system,
          messages: apiMessages,
          tools,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();

      // Парсить ответ Claude
      let text: string | null = null;
      const toolCalls: AIToolCall[] = [];

      for (const block of data.content) {
        if (block.type === 'text') {
          text = (text || '') + block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            args: block.input,
          });
        }
      }

      return {
        text,
        toolCalls,
        done: data.stop_reason === 'end_turn',
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      };
    },
  };
}

// ─────────────────────────────────────────────
// OPENAI АДАПТЕР
// (Совместим с OpenAI, DeepSeek, и другими
//  провайдерами с OpenAI-совместимым API)
// ─────────────────────────────────────────────

function buildOpenAITools() {
  return TOOL_DEFINITIONS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function buildOpenAIMessages(
  messages: AIMessage[]
): Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }> {
  const apiMessages: Array<{
    role: string;
    content: string | null;
    tool_calls?: unknown[];
    tool_call_id?: string;
    name?: string;
  }> = [];

  for (const msg of messages) {
    if (msg.role === 'tool') {
      apiMessages.push({
        role: 'tool',
        content: msg.content,
        tool_call_id: msg.tool_call_id,
        name: msg.name,
      });
      continue;
    }

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      apiMessages.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.toolCalls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        })),
      });
      continue;
    }

    apiMessages.push({ role: msg.role, content: msg.content });
  }

  return apiMessages;
}

interface OpenAIProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
}

function createOpenAICompatibleProvider(config: OpenAIProviderConfig): AIProvider {
  return {
    name: config.name,

    async call(messages: AIMessage[], model: string): Promise<AIResponse> {
      const apiMessages = buildOpenAIMessages(messages);
      const tools = buildOpenAITools();

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          tools,
          tool_choice: 'auto',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`${config.name} API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new Error(`${config.name}: no choices in response`);
      }

      const msg = choice.message;
      const text = msg.content || null;
      const toolCalls: AIToolCall[] = [];

      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function?.arguments || '{}');
          } catch {
            args = { _raw: tc.function?.arguments };
          }
          toolCalls.push({
            id: tc.id,
            name: tc.function?.name || 'unknown',
            args,
          });
        }
      }

      return {
        text,
        toolCalls,
        done: choice.finish_reason === 'stop',
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    },
  };
}

export function createOpenAIProvider(apiKeyOverride?: string): AIProvider {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set. Add it in Dev Console settings.');
  return createOpenAICompatibleProvider({
    name: 'openai',
    apiKey,
    baseUrl: 'https://api.openai.com/v1',
  });
}

export function createDeepSeekProvider(apiKeyOverride?: string): AIProvider {
  const apiKey = apiKeyOverride || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set. Add it in Dev Console settings.');
  return createOpenAICompatibleProvider({
    name: 'deepseek',
    apiKey,
    baseUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  });
}

export function createGeminiProvider(apiKeyOverride?: string): AIProvider {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set. Add it in Dev Console settings.');

  return {
    name: 'gemini',

    async call(messages: AIMessage[], model: string): Promise<AIResponse> {
      const tools = buildOpenAITools();
      const systemMsg = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const geminiMessages = userMessages.map(msg => {
        // Handle tool results as separate 'function' role messages
        if (msg.role === 'tool') {
          return {
            role: 'function' as const,
            parts: [{
              functionResponse: {
                name: msg.name || 'unknown',
                response: { content: msg.content }
              }
            }]
          };
        }

        // Handle assistant messages (may contain text and/or tool calls)
        if (msg.role === 'assistant') {
          const parts: unknown[] = [];
          
          // Add text if present
          if (msg.content && typeof msg.content === 'string') {
            parts.push({ text: msg.content });
          }
          
          // Add tool calls if present
          if (msg.toolCalls && msg.toolCalls.length > 0) {
            for (const tc of msg.toolCalls) {
              parts.push({ 
                functionCall: { 
                  name: tc.name, 
                  args: tc.args 
                } 
              });
            }
          }
          
          return { role: 'model' as const, parts };
        }

        // Handle user messages (simple text)
        return { 
          role: 'user' as const, 
          parts: [{ text: typeof msg.content === 'string' ? msg.content : String(msg.content) }] 
        };
      });

      const body: Record<string, unknown> = {
        contents: geminiMessages,
        tools: [{ functionDeclarations: tools.map((t: { function: { name: string; description: string; parameters: unknown } }) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        })) }],
        generationConfig: { maxOutputTokens: 8192 },
      };

      if (systemMsg) {
        body.systemInstruction = { parts: [{ text: typeof systemMsg.content === 'string' ? systemMsg.content : JSON.stringify(systemMsg.content) }] };
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let text: string | null = null;
      const toolCalls: AIToolCall[] = [];

      for (const part of parts) {
        if (part.text) text = (text || '') + part.text;
        if (part.functionCall) {
          toolCalls.push({
            id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: part.functionCall.name,
            args: part.functionCall.args || {},
          });
        }
      }

      return {
        text,
        toolCalls,
        done: toolCalls.length === 0,
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      };
    },
  };
}

// ─────────────────────────────────────────────
// ФАБРИКА ПРОВАЙДЕРОВ
// ─────────────────────────────────────────────

export function getProvider(providerName: string, apiKey?: string): AIProvider {
  switch (providerName) {
    case 'claude':
      return createClaudeProvider(apiKey);
    case 'openai':
      return createOpenAIProvider(apiKey);
    case 'deepseek':
      return createDeepSeekProvider(apiKey);
    case 'gemini':
      return createGeminiProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

// Доступные модели для UI (dropdown в Dev Console)
export const AVAILABLE_MODELS: Record<string, string[]> = {
  claude: [
    'claude-sonnet-4-6',
    'claude-opus-4-6',
    'claude-haiku-4-5-20251001',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o1-mini',
    'o3-mini',
  ],
  gemini: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner',
  ],
};
