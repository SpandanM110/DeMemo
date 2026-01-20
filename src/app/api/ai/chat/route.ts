/**
 * API Route: AI Chat using Google Gemini
 * Handles conversation with memory context
 * Supports user-provided API keys (BYOK)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rate limit: 5 messages per session for users without their own API key
const RATE_LIMIT = 5;

// System prompt for DeMemo AI
const SYSTEM_PROMPT = `You are an AI assistant powered by DeMemo - a decentralized memory layer that stores conversations on IPFS and Arc Network.

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
      messageCount 
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Determine which API key to use
    const apiKey = userApiKey?.trim() || DEFAULT_GEMINI_API_KEY;
    const isUsingUserKey = !!userApiKey?.trim();

    // Validate API key exists
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your own Gemini API key in Settings.' },
        { status: 500 }
      );
    }

    // Check rate limit for users not using their own key
    if (!isUsingUserKey && messageCount !== undefined && messageCount >= RATE_LIMIT) {
      return NextResponse.json(
        { 
          error: 'Rate limit reached',
          rateLimited: true,
          message: `You've reached the limit of ${RATE_LIMIT} messages for this session. Add your own Gemini API key in Settings for unlimited messages, or start a new chat session.`,
          limit: RATE_LIMIT
        },
        { status: 429 }
      );
    }

    // Initialize Gemini with the appropriate key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build the conversation with context
    let contextPrompt = SYSTEM_PROMPT;

    // Add memory context if available
    if (memoryContext && memoryContext.length > 0) {
      contextPrompt += `\n\n## Previous Memories from the User:\n`;
      for (const memory of memoryContext) {
        contextPrompt += `\n### Memory from ${new Date(memory.timestamp).toLocaleDateString()}:\n`;
        for (const msg of memory.conversation.messages) {
          contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }
      }
      contextPrompt += `\n---\nUse the above memories to personalize your response. Reference things the user has shared before naturally.`;
    }

    // Build chat history
    const history = [];
    
    // Add system context as first message
    history.push({
      role: 'user',
      parts: [{ text: `[System Context]\n${contextPrompt}\n\n[End System Context]\n\nPlease acknowledge you understand and are ready to help.` }],
    });
    history.push({
      role: 'model',
      parts: [{ text: 'I understand! I\'m your DeMemo AI assistant, ready to help. I\'ll use any previous memories to personalize our conversation. How can I assist you today?' }],
    });

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Create chat session
    const chat = model.startChat({ history });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({
      success: true,
      response,
      timestamp: Date.now(),
      isUsingUserKey,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    // Check if it's an API key error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Gemini API key in Settings.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
