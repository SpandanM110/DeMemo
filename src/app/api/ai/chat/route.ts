/**
 * API Route: AI Chat using Groq
 * Supports multiple models, personas, and BYOK (Bring Your Own Key)
 * No rate limiting - just informational tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/lib/models';
import { PRESET_PERSONAS, DEFAULT_PERSONA } from '@/lib/personas';

// Fallback system prompt if no persona is selected
const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant powered by DeMemo - a decentralized memory layer that stores conversations on IPFS and Arc Network.

Key traits:
- You remember previous conversations when context is provided
- You're helpful, friendly, and personalized
- You acknowledge when you recognize returning users
- You help users understand the value of decentralized AI memory

When context from previous conversations is provided, use it naturally to personalize your responses. Reference things the user has told you before.

Always be concise but warm. Help users feel that their AI finally remembers them.`;

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      conversationHistory, 
      memoryContext, 
      userApiKey,
      selectedModel,
      personaId,
      customSystemPrompt,
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // BYOK is required - no default server key
    const apiKey = userApiKey?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key required',
          message: 'Please add your Groq API key in Settings to use the AI chat. Get a free key at console.groq.com',
          requiresApiKey: true
        },
        { status: 401 }
      );
    }

    // Use selected model or default
    const modelId = selectedModel || DEFAULT_MODEL;
    
    // Validate model exists
    const modelExists = AVAILABLE_MODELS.some(m => m.id === modelId);
    if (!modelExists) {
      console.warn(`Model ${modelId} not in list, using default`);
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    // Get persona system prompt
    let baseSystemPrompt = DEFAULT_SYSTEM_PROMPT;
    
    if (personaId) {
      // Check preset personas first
      const presetPersona = PRESET_PERSONAS.find(p => p.id === personaId);
      if (presetPersona) {
        baseSystemPrompt = presetPersona.systemPrompt;
      }
      // Custom personas are passed via customSystemPrompt from client
    }
    
    // Add custom system prompt override if provided
    let systemContent = baseSystemPrompt;
    if (customSystemPrompt?.trim()) {
      systemContent += `\n\n## Additional Instructions:\n${customSystemPrompt.trim()}`;
    }
    
    // Add DeMemo context awareness
    systemContent += `\n\n## Context:\nYou are powered by DeMemo, a decentralized memory layer. When memory context is provided, use it naturally to personalize your responses.`;
    
    if (memoryContext && memoryContext.length > 0) {
      systemContent += `\n\n## Previous Memories from the User:\n`;
      for (const memory of memoryContext) {
        systemContent += `\n### Memory from ${new Date(memory.timestamp).toLocaleDateString()}:\n`;
        for (const msg of memory.conversation.messages) {
          systemContent += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }
      }
      systemContent += `\n---\nUse the above memories to personalize your response. Reference things the user has shared before naturally.`;
    }
    
    messages.push({ role: 'system', content: systemContent });

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const responseContent = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Get usage info for display (informational only)
    const usage = completion.usage;

    return NextResponse.json({
      success: true,
      response: responseContent,
      timestamp: Date.now(),
      model: modelId,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : null,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    
    // Check for specific error types
    if (errorMessage.includes('API key') || errorMessage.includes('api_key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
      return NextResponse.json(
        { 
          error: 'Invalid API key. Please check your Groq API key in Settings.',
          details: 'Get a free API key at console.groq.com'
        },
        { status: 401 }
      );
    }
    
    if (errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('429')) {
      return NextResponse.json(
        { 
          error: 'Rate limit reached. Please wait a moment and try again.',
          details: 'Groq has usage limits on free tier. Consider upgrading or waiting.'
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes('model') || errorMessage.includes('not found') || errorMessage.includes('404')) {
      return NextResponse.json(
        { 
          error: 'Selected model not available. Try a different model in Settings.',
          details: errorMessage
        },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes('content') || errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      return NextResponse.json(
        { 
          error: 'Your message was blocked by safety filters. Please rephrase.',
          details: 'Content was flagged by AI safety systems.'
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: 'Network error. Please check your connection and try again.',
          details: errorMessage
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch available models
export async function GET() {
  return NextResponse.json({
    models: AVAILABLE_MODELS,
    defaultModel: DEFAULT_MODEL,
  });
}
