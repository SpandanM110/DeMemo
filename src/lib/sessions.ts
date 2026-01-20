// Session Management Utilities - localStorage based
import type { ChatSession, Message } from '@/types';

const SESSIONS_KEY = 'memorychain_sessions';
const MAX_TITLE_LENGTH = 50;

/**
 * Generate a title from the first user message
 */
export function generateSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  
  let title = firstUserMessage.content.trim();
  
  // Truncate and clean up
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }
  
  // Remove newlines
  title = title.replace(/\n/g, ' ');
  
  return title || 'New Chat';
}

/**
 * Get all sessions for a wallet address from localStorage
 */
export function getSessions(walletAddress: string): ChatSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = `${SESSIONS_KEY}_${walletAddress.toLowerCase()}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const sessions = JSON.parse(data) as ChatSession[];
    // Sort by updatedAt descending (newest first)
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
}

/**
 * Save all sessions to localStorage
 */
function saveSessions(walletAddress: string, sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${SESSIONS_KEY}_${walletAddress.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
}

/**
 * Session configuration for creating new chats
 */
export interface SessionConfig {
  personaId?: string;
  modelId?: string;
  customPrompt?: string;
}

/**
 * Create a new chat session with optional AI configuration
 */
export function createSession(walletAddress: string, config?: SessionConfig): ChatSession {
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSaved: false,
    // Per-session AI config
    personaId: config?.personaId,
    modelId: config?.modelId,
    customPrompt: config?.customPrompt,
  };
  
  const sessions = getSessions(walletAddress);
  sessions.unshift(session); // Add to beginning
  saveSessions(walletAddress, sessions);
  
  return session;
}

/**
 * Get a session by ID
 */
export function getSessionById(walletAddress: string, sessionId: string): ChatSession | null {
  const sessions = getSessions(walletAddress);
  return sessions.find(s => s.id === sessionId) || null;
}

/**
 * Update a session
 */
export function updateSession(walletAddress: string, session: ChatSession): void {
  const sessions = getSessions(walletAddress);
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index !== -1) {
    // Update title if we have messages and title is still default
    if (session.messages.length > 0 && session.title === 'New Chat') {
      session.title = generateSessionTitle(session.messages);
    }
    
    session.updatedAt = Date.now();
    sessions[index] = session;
    saveSessions(walletAddress, sessions);
  }
}

/**
 * Add a message to a session
 */
export function addMessageToSession(
  walletAddress: string,
  sessionId: string,
  message: Message
): ChatSession | null {
  const session = getSessionById(walletAddress, sessionId);
  if (!session) return null;
  
  session.messages.push(message);
  session.updatedAt = Date.now();
  
  // Auto-generate title from first user message
  if (session.title === 'New Chat' && message.role === 'user') {
    session.title = generateSessionTitle(session.messages);
  }
  
  updateSession(walletAddress, session);
  return session;
}

/**
 * Delete a session
 */
export function deleteSession(walletAddress: string, sessionId: string): void {
  const sessions = getSessions(walletAddress);
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveSessions(walletAddress, filtered);
}

/**
 * Rename a session
 */
export function renameSession(walletAddress: string, sessionId: string, newTitle: string): void {
  const session = getSessionById(walletAddress, sessionId);
  if (!session) return;
  
  session.title = newTitle.trim() || 'Untitled';
  updateSession(walletAddress, session);
}

/**
 * Mark a session as saved to blockchain
 */
export function markSessionAsSaved(
  walletAddress: string,
  sessionId: string,
  cid: string,
  txHash?: string
): void {
  const session = getSessionById(walletAddress, sessionId);
  if (!session) return;
  
  session.isSaved = true;
  session.savedCid = cid;
  session.savedTxHash = txHash;
  updateSession(walletAddress, session);
}

/**
 * Get count of unsaved sessions
 */
export function getUnsavedSessionsCount(walletAddress: string): number {
  const sessions = getSessions(walletAddress);
  return sessions.filter(s => !s.isSaved && s.messages.length > 0).length;
}

/**
 * Clear all sessions (for logout)
 */
export function clearAllSessions(walletAddress: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${SESSIONS_KEY}_${walletAddress.toLowerCase()}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear sessions:', error);
  }
}
