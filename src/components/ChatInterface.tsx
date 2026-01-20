'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Save, Coins, AlertTriangle, Settings } from 'lucide-react';
import type { Message, Memory, ChatSession } from '@/types';

const MESSAGE_LIMIT = 5;

interface ChatInterfaceProps {
  session: ChatSession | null;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  memories: Memory[];
  isConnected: boolean;
  onSaveToMemory?: () => void;
  isSaving?: boolean;
  rateLimitError?: string | null;
  hasApiKey?: boolean;
  onOpenSettings?: () => void;
}

export default function ChatInterface({
  session,
  onSendMessage,
  isLoading,
  memories,
  isConnected,
  onSaveToMemory,
  isSaving = false,
  rateLimitError,
  hasApiKey = false,
  onOpenSettings,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = session?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when session changes
  useEffect(() => {
    if (session && inputRef.current) {
      inputRef.current.focus();
    }
  }, [session?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConnected || !session) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Bot className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-zinc-500 max-w-md text-sm">
            Connect your wallet to start chatting with an AI that remembers you across sessions.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Select or Create a Chat
          </h3>
          <p className="text-zinc-500 max-w-md text-sm">
            Choose an existing conversation from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* Session Header */}
      <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium text-zinc-100 truncate max-w-md">
            {session.title}
          </h2>
          {session.isSaved && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 rounded-full text-xs text-teal-400">
              <Save className="w-3 h-3" />
              On-chain
            </span>
          )}
        </div>
        
        {/* Save Button - Only show if not saved and has messages */}
        {!session.isSaved && messages.length > 0 && onSaveToMemory && (
          <button
            onClick={onSaveToMemory}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                <span>Save to Memory (0.01 USDC)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Memory Context Banner */}
      {memories.length > 0 && (
        <div className="px-4 py-2 bg-zinc-800/30 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="w-4 h-4" />
            <span>
              AI has access to {memories.length} saved memor{memories.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
        </div>
      )}

      {/* Rate Limit Error */}
      {rateLimitError && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-200">{rateLimitError}</p>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="mt-2 flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
                >
                  <Settings className="w-4 h-4" />
                  Open Settings
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Count (when not using own API key) */}
      {!hasApiKey && !session.isSaved && messages.length > 0 && (
        <div className="px-4 py-2 bg-zinc-800/20 border-b border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              {messages.filter(m => m.role === 'user').length} / {MESSAGE_LIMIT} messages used
            </span>
            {messages.filter(m => m.role === 'user').length >= MESSAGE_LIMIT - 1 && (
              <span className="text-amber-400 text-xs">Approaching limit</span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-zinc-500" />
              </div>
              <h3 className="text-base font-medium text-zinc-200 mb-1">
                Start a Conversation
              </h3>
              <p className="text-zinc-600 text-sm max-w-sm">
                Type a message below. When you&apos;re happy with this chat, save it to your on-chain memory!
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-zinc-400" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'bg-zinc-800/50 text-zinc-200 border border-zinc-800'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                <span className="text-zinc-500 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none text-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
