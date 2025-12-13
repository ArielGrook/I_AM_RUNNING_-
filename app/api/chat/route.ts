import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createComponentFromTemplate, componentCatalog } from '@/lib/components/catalog';
import { Category, StyleVariant, ColorToken } from '@/lib/types/project';
import { getRedisClient, isRedisAvailable } from '@/lib/redis/client';

// Request/Response schemas
const ChatRequestSchema = z.object({
  goal: z.string().min(1).max(1000),
  constraints: z.record(z.any()).optional(),
  preferredStyles: z.array(z.enum(['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful'])).optional(),
  categories: z.array(z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom'])).optional(),
  palette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string()
  }).optional()
});

const ComponentResponseSchema = z.object({
  type: z.string(),
  category: z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom']),
  style: z.enum(['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful']).optional(),
  color: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string()
  }).optional(),
  props: z.record(z.any()).optional()
});

const ChatResponseSchema = z.object({
  components: z.array(ComponentResponseSchema),
  suggestions: z.array(z.string()).optional(),
  metadata: z.object({
    totalComponents: z.number(),
    estimatedTime: z.string(),
    confidence: z.number()
  }).optional()
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;
type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting with Redis (distributed, scalable)
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10); // requests per minute
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds

/**
 * Check rate limit for a client using Redis
 * Returns true if request is allowed, false if rate limit exceeded
 * 
 * Fixes Critical Error #7 from BIG REVIEW.md
 */
async function checkRateLimit(clientId: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `rate_limit:chat:${clientId}`;
    
    // Check if Redis is available
    const available = await isRedisAvailable();
    if (!available) {
      // Fallback: Allow request if Redis is down (fail open)
      console.warn('Redis unavailable, allowing request (rate limit disabled)');
      return true;
    }
    
    // Get current count
    const count = await redis.incr(key);
    
    // Set expiration on first request
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    // Check if limit exceeded
    if (count > RATE_LIMIT) {
      // Get TTL to inform user when they can retry
      const ttl = await redis.ttl(key);
      return false;
    }
    
    return true;
  } catch (error) {
    // On error, allow request (fail open) but log error
    console.error('Rate limit check failed:', error);
    return true;
  }
}

// Component selection logic
function selectBestComponents(
  goal: string,
  constraints: Record<string, any> = {},
  preferredStyles: StyleVariant[] = ['minimal'],
  categories: Category[] = []
): ChatResponse['components'] {
  const components: ChatResponse['components'] = [];
  
  // Determine needed components based on goal
  const goalLower = goal.toLowerCase();
  const needsHeader = goalLower.includes('header') || goalLower.includes('navigation') || !goalLower.includes('no header');
  const needsHero = goalLower.includes('hero') || goalLower.includes('landing') || goalLower.includes('main');
  const needsFooter = goalLower.includes('footer') || goalLower.includes('contact') || !goalLower.includes('no footer');
  
  // Get preferred style or default to first preference
  const style = preferredStyles[0] || 'minimal';
  
  // Add components based on analysis
  if (needsHeader) {
    const headerTemplate = componentCatalog.find(t => t.category === 'header');
    if (headerTemplate) {
      components.push({
        type: 'header',
        category: 'header',
        style,
        props: {
          templateId: headerTemplate.id,
          variant: style
        }
      });
    }
  }
  
  if (needsHero) {
    const heroTemplate = componentCatalog.find(t => t.category === 'hero');
    if (heroTemplate) {
      components.push({
        type: 'section',
        category: 'hero',
        style,
        props: {
          templateId: heroTemplate.id,
          variant: style
        }
      });
    }
  }
  
  // Add additional sections based on categories requested
  if (categories.length > 0) {
    categories.forEach(category => {
      if (category !== 'header' && category !== 'hero' && category !== 'footer') {
        const template = componentCatalog.find(t => t.category === category);
        if (template) {
          components.push({
            type: 'section',
            category,
            style,
            props: {
              templateId: template.id,
              variant: style
            }
          });
        }
      }
    });
  }
  
  if (needsFooter) {
    const footerTemplate = componentCatalog.find(t => t.category === 'footer');
    if (footerTemplate) {
      components.push({
        type: 'footer',
        category: 'footer',
        style,
        props: {
          templateId: footerTemplate.id,
          variant: style
        }
      });
    }
  }
  
  return components;
}

// AI-powered component generation
async function generateWithAI(request: ChatRequest): Promise<ChatResponse> {
  try {
    const systemPrompt = `You are a web design AI assistant. Based on user goals, suggest website components.
    
    Available component categories: header, hero, footer, section, button, form, navigation, custom
    Available styles: minimal, modern, classic, bold, elegant, playful
    
    Return a JSON object matching this structure:
    {
      "components": [
        {
          "type": "string",
          "category": "category_name",
          "style": "style_name",
          "props": {}
        }
      ],
      "suggestions": ["suggestion1", "suggestion2"],
      "metadata": {
        "totalComponents": number,
        "estimatedTime": "X minutes",
        "confidence": 0.0-1.0
      }
    }`;
    
    const userPrompt = `Goal: ${request.goal}
    Constraints: ${JSON.stringify(request.constraints || {})}
    Preferred Styles: ${request.preferredStyles?.join(', ') || 'any'}
    Categories: ${request.categories?.join(', ') || 'any'}
    Color Palette: ${JSON.stringify(request.palette || {})}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');
    
    const parsed = JSON.parse(result);
    return ChatResponseSchema.parse(parsed);
    
  } catch (error) {
    // Fallback to rule-based selection
    console.error('AI generation failed, using fallback:', error);
    return {
      components: selectBestComponents(
        request.goal,
        request.constraints,
        request.preferredStyles,
        request.categories
      ),
      suggestions: [
        'Consider adding more content sections',
        'You might want to include a call-to-action',
        'Think about adding social proof elements'
      ],
      metadata: {
        totalComponents: 3,
        estimatedTime: '5 minutes',
        confidence: 0.7
      }
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';
    
    // Check rate limit (async with Redis)
    const rateLimitAllowed = await checkRateLimit(clientId);
    if (!rateLimitAllowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: RATE_LIMIT_WINDOW 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': RATE_LIMIT_WINDOW.toString()
          }
        }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = ChatRequestSchema.parse(body);
    
    // Generate response (AI or rule-based)
    let response: ChatResponse;
    
    if (process.env.OPENAI_API_KEY) {
      response = await generateWithAI(validatedRequest);
    } else {
      // Use rule-based selection if no API key
      response = {
        components: selectBestComponents(
          validatedRequest.goal,
          validatedRequest.constraints,
          validatedRequest.preferredStyles,
          validatedRequest.categories
        ),
        suggestions: [
          'AI suggestions are not available without OpenAI API key',
          'Using rule-based component selection'
        ],
        metadata: {
          totalComponents: 3,
          estimatedTime: '5 minutes',
          confidence: 0.6
        }
      };
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          code: 'INVALID_REQUEST',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

