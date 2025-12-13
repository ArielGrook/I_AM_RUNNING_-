/**
 * Chat Streaming API
 * 
 * Streaming endpoint for real-time chat responses.
 * 
 * Stage 3 Module 7: Chat with ChatGPT
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { sanitizePrompt } from '@/lib/utils/sanitize';
import { getRedisClient, isRedisAvailable } from '@/lib/redis/client';
import { ChatRequestSchema, JsonContractSchema } from '@/lib/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10);
const RATE_LIMIT_WINDOW = 60;

async function checkRateLimit(clientId: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (!redis) return true;

    const available = await isRedisAvailable();
    if (!available) return true;

    const key = `rate_limit:chat:${clientId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    return count <= RATE_LIMIT;
  } catch {
    return true;
  }
}

/**
 * Generate system prompt for JSON-contract generation
 */
function getSystemPrompt(language: string = 'en'): string {
  const prompts: Record<string, string> = {
    en: `You are a web design AI assistant. Generate structured JSON contracts to modify website components.

Available actions: create, update, delete, style
Available categories: header, hero, footer, section, button, form, navigation, custom
Available styles: minimal, modern, classic, bold, elegant, playful

Return a JSON object with this structure:
{
  "action": "create|update|delete|style",
  "components": [{
    "type": "string",
    "category": "category_name",
    "style": "style_name",
    "html": "HTML content (optional)",
    "props": {}
  }],
  "styles": {
    "colors": {"primary": "#hex", ...},
    "fonts": {"heading": "font-name", "body": "font-name"}
  },
  "message": "Human-readable explanation"
}

Always return valid JSON.`,
    ru: `Вы - AI-ассистент веб-дизайна. Генерируйте структурированные JSON-контракты для изменения компонентов сайта.

Доступные действия: create, update, delete, style
Доступные категории: header, hero, footer, section, button, form, navigation, custom
Доступные стили: minimal, modern, classic, bold, elegant, playful

Возвращайте JSON объект с этой структурой:
{
  "action": "create|update|delete|style",
  "components": [{
    "type": "string",
    "category": "category_name",
    "style": "style_name",
    "html": "HTML контент (опционально)",
    "props": {}
  }],
  "styles": {
    "colors": {"primary": "#hex", ...},
    "fonts": {"heading": "font-name", "body": "font-name"}
  },
  "message": "Человекочитаемое объяснение"
}

Всегда возвращайте валидный JSON.`,
    he: `אתה עוזר AI לעיצוב אתרים. צור חוזי JSON מובנים לשינוי רכיבי אתר.

פעולות זמינות: create, update, delete, style
קטגוריות זמינות: header, hero, footer, section, button, form, navigation, custom
סגנונות זמינים: minimal, modern, classic, bold, elegant, playful

החזר אובייקט JSON עם המבנה הזה:
{
  "action": "create|update|delete|style",
  "components": [{
    "type": "string",
    "category": "category_name",
    "style": "style_name",
    "html": "תוכן HTML (אופציונלי)",
    "props": {}
  }],
  "styles": {
    "colors": {"primary": "#hex", ...},
    "fonts": {"heading": "font-name", "body": "font-name"}
  },
  "message": "הסבר קריא"
}

תמיד החזר JSON תקין.`,
  };

  return prompts[language] || prompts.en;
}

export async function POST(request: NextRequest) {
  try {
    const clientId = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'anonymous';

    // Check rate limit
    const rateLimitAllowed = await checkRateLimit(clientId);
    if (!rateLimitAllowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': RATE_LIMIT_WINDOW.toString(),
          },
        }
      );
    }

    // Parse request
    const body = await request.json();
    const validated = ChatRequestSchema.parse(body);
    
    // Sanitize user input (BIG REVIEW #8)
    const sanitizedMessage = sanitizePrompt(validated.message);
    const language = validated.context?.language || 'en';

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: getSystemPrompt(language) },
              { role: 'user', content: sanitizedMessage },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
          });

          let fullContent = '';
          let contractJson = '';

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              contractJson += delta;
              
              // Send incremental updates
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ type: 'token', content: delta })}\n\n`)
              );
            }
          }

          // Try to parse JSON contract
          try {
            // Extract JSON from response (might have markdown code blocks)
            const jsonMatch = contractJson.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : contractJson;
            const parsed = JSON.parse(jsonStr);
            const contract = JsonContractSchema.parse(parsed);

            // Send contract
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'contract', contract })}\n\n`)
            );
          } catch (parseError) {
            console.error('Failed to parse contract:', parseError);
            // Send message without contract
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'message', content: fullContent })}\n\n`)
            );
          }

          // Send completion
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', error: 'Streaming failed' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}








