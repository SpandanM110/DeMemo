'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Shield, Globe, Github, ExternalLink } from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import WalletSelector from '@/components/WalletSelector';
import SessionSidebar from '@/components/SessionSidebar';
import ChatInterface from '@/components/ChatInterface';
import SettingsModal, { getSettings } from '@/components/SettingsModal';
import NewChatModal from '@/components/NewChatModal';
import MemoryViewer from '@/components/MemoryViewer';
import { fullWalletConnect, restoreWalletConnection, clearCachedEncryptionSignature } from '@/lib/wallet';
import { getUSDCBalance, getMemoryCount } from '@/lib/blockchain';
import { saveMemory, loadMemories } from '@/lib/memory';
import { deriveKeyFromSignature } from '@/lib/encryption';
import {
  getSessions,
  createSession,
  getSessionById,
  updateSession,
  deleteSession,
  renameSession,
  markSessionAsSaved,
  type SessionConfig,
} from '@/lib/sessions';
import type { WalletState, Message, Memory, ChatSession, WalletType } from '@/types';

export default function Home() {
  // Wallet state
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    balance: null,
    encryptionKey: null,
  });
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [circleWalletId, setCircleWalletId] = useState<string | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Chat state
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Memory state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [viewingMemory, setViewingMemory] = useState<Memory | null>(null);
  const [activeMemoryContext, setActiveMemoryContext] = useState<Memory[]>([]);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Get active session
  const activeSession = activeSessionId && walletState.address
    ? getSessionById(walletState.address, activeSessionId)
    : null;

  // Refresh sessions from localStorage
  const refreshSessions = useCallback(() => {
    if (walletState.address) {
      setSessions(getSessions(walletState.address));
    }
  }, [walletState.address]);

  // Load sessions when wallet connects
  useEffect(() => {
    if (walletState.address) {
      refreshSessions();
    }
  }, [walletState.address, refreshSessions]);

  // Load user settings when wallet connects
  useEffect(() => {
    if (walletState.address) {
      const settings = getSettings(walletState.address);
      setUserApiKey(settings.groqApiKey || '');
    }
  }, [walletState.address]);

  // Restore wallet connection on page load (for MetaMask)
  // Only restore if user has previously authenticated (has encryption key)
  useEffect(() => {
    // Don't restore if:
    // 1. Already connected
    // 2. Wallet type is set (user is in process of connecting)
    // 3. Wallet selector is open (user is choosing wallet)
    if (walletState.isConnected || walletType !== null || showWalletSelector) return;

    const restoreConnection = async () => {
      try {
        const restoredState = await restoreWalletConnection();
        // Only restore if encryption key exists (user has authenticated before)
        // This prevents showing chat interface before authentication
        if (restoredState && restoredState.address && restoredState.encryptionKey) {
          setWalletState(restoredState);
          setWalletType('metamask');

          // Load memories and sessions
          const result = await loadMemories(restoredState.address, restoredState.encryptionKey);
          if (result.success && result.memories) {
            setMemories(result.memories);
          }

          const count = await getMemoryCount(restoredState.address);
          setMemoryCount(count);

          const existingSessions = getSessions(restoredState.address);
          if (existingSessions.length === 0) {
            const newSession = createSession(restoredState.address);
            setActiveSessionId(newSession.id);
          } else {
            setActiveSessionId(existingSessions[0].id);
          }
          setSessions(getSessions(restoredState.address));
        }
      } catch (error) {
        console.error('Failed to restore wallet connection:', error);
      }
    };

    restoreConnection();
  }, [walletState.isConnected, walletType, showWalletSelector]); // Include showWalletSelector in deps

  // Show wallet selector modal
  const handleShowWalletSelector = () => {
    setShowWalletSelector(true);
    setConnectError(null);
  };

  // Handle MetaMask wallet connection
  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    setConnectError(null);

    try {
      const state = await fullWalletConnect();
      setWalletState(state);
      setWalletType('metamask');
      setShowWalletSelector(false);

      // Load existing memories
      if (state.encryptionKey && state.address) {
        const result = await loadMemories(state.address, state.encryptionKey);
        if (result.success && result.memories) {
          setMemories(result.memories);
        }

        // Get memory count from blockchain
        const count = await getMemoryCount(state.address);
        setMemoryCount(count);

        // Load sessions and create one if none exist
        const existingSessions = getSessions(state.address);
        if (existingSessions.length === 0) {
          const newSession = createSession(state.address);
          setActiveSessionId(newSession.id);
        } else {
          setActiveSessionId(existingSessions[0].id);
        }
        setSessions(getSessions(state.address));
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      setConnectError(error instanceof Error ? error.message : 'Failed to connect MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Circle wallet connection
  const handleConnectCircle = async () => {
    setIsConnecting(true);
    setConnectError(null);

    try {
      // Create or get Circle wallet via API
      const response = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Circle wallet');
      }

      const wallet = data.wallet;
      
      if (!wallet) {
        throw new Error('No wallet returned from API');
      }

      // Sign message to derive encryption key
      const signResponse = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign',
          walletId: wallet.id,
          message: `DeMemo Authentication\n\nWallet: ${wallet.address}`,
        }),
      });

      const signData = await signResponse.json();
      
      if (!signResponse.ok) {
        throw new Error(signData.error || 'Failed to sign message');
      }

      const encryptionKey = await deriveKeyFromSignature(signData.signature);

      // Fetch balance using read-only provider
      let balance = '0.00';
      try {
        balance = await getUSDCBalance(wallet.address);
      } catch (e) {
        console.warn('Failed to fetch balance:', e);
      }

      // Update state
      setWalletState({
        address: wallet.address,
        isConnected: true,
        chainId: 5042002, // Arc Testnet
        balance,
        encryptionKey,
      });
      setWalletType('circle');
      setCircleWalletId(wallet.id);
      setShowWalletSelector(false);

      // Load existing memories
      try {
        const result = await loadMemories(wallet.address, encryptionKey);
        if (result.success && result.memories) {
          setMemories(result.memories);
        }
        const count = await getMemoryCount(wallet.address);
        setMemoryCount(count);
      } catch (e) {
        console.warn('Failed to load memories:', e);
      }

      // Load sessions and create one if none exist
      const existingSessions = getSessions(wallet.address);
      if (existingSessions.length === 0) {
        const newSession = createSession(wallet.address);
        setActiveSessionId(newSession.id);
      } else {
        setActiveSessionId(existingSessions[0].id);
      }
      setSessions(getSessions(wallet.address));

    } catch (error: unknown) {
      console.error('Circle wallet connection error:', error);
      const message = error instanceof Error ? error.message : String(error);
      setConnectError(message || 'Failed to connect Circle wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Legacy handleConnect for backward compatibility
  const handleConnect = handleShowWalletSelector;

  // Handle wallet disconnection
  const handleDisconnect = () => {
    // Clear cached signature if MetaMask
    if (walletState.address && walletType === 'metamask') {
      clearCachedEncryptionSignature(walletState.address);
    }

    setWalletState({
      address: null,
      isConnected: false,
      chainId: null,
      balance: null,
      encryptionKey: null,
    });
    setWalletType(null);
    setCircleWalletId(null);
    setSessions([]);
    setActiveSessionId(null);
    setMemories([]);
    setMemoryCount(0);
  };

  // Listen for account changes (MetaMask only)
  useEffect(() => {
    // Only add MetaMask listeners when connected via MetaMask
    if (walletType !== 'metamask' || !walletState.isConnected) return;
    
    // Check if MetaMask is available
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      // Guard against receiving Event objects instead of arrays
      if (!Array.isArray(accounts)) {
        console.warn('Received non-array from accountsChanged:', typeof accounts);
        return;
      }
      
      if (accounts.length === 0) {
        // User disconnected their wallet
        if (walletState.address) {
          clearCachedEncryptionSignature(walletState.address);
        }
        setWalletState({
          address: null,
          isConnected: false,
          chainId: null,
          balance: null,
          encryptionKey: null,
        });
        setWalletType(null);
        setCircleWalletId(null);
        setSessions([]);
        setActiveSessionId(null);
        setMemories([]);
        setMemoryCount(0);
      } else if (accounts[0] !== walletState.address) {
        // Account changed - disconnect and let them reconnect
        if (walletState.address) {
          clearCachedEncryptionSignature(walletState.address);
        }
        setWalletState({
          address: null,
          isConnected: false,
          chainId: null,
          balance: null,
          encryptionKey: null,
        });
        setWalletType(null);
        setCircleWalletId(null);
        setSessions([]);
        setActiveSessionId(null);
        setMemories([]);
        setMemoryCount(0);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [walletState.address, walletState.isConnected, walletType]);

  // Refresh balance periodically (MetaMask only)
  useEffect(() => {
    if (!walletState.address || walletType !== 'metamask') return;

    const refreshBalance = async () => {
      try {
        const balance = await getUSDCBalance(walletState.address!);
        setWalletState((prev) => ({ ...prev, balance }));
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    };

    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [walletState.address, walletType]);

  // Session handlers
  const handleNewSession = () => {
    // Open the new chat modal instead of creating directly
    setShowNewChatModal(true);
  };

  // Create session with config from modal
  const handleCreateSessionWithConfig = (config: SessionConfig) => {
    if (!walletState.address) return;
    const newSession = createSession(walletState.address, config);
    refreshSessions();
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!walletState.address) return;
    deleteSession(walletState.address, sessionId);
    refreshSessions();
    
    // If deleting active session, switch to another or create new
    if (sessionId === activeSessionId) {
      const remaining = getSessions(walletState.address);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        const newSession = createSession(walletState.address);
        refreshSessions();
        setActiveSessionId(newSession.id);
      }
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!walletState.address) return;
    renameSession(walletState.address, sessionId, newTitle);
    refreshSessions();
  };

  // Memory handlers
  const handleRefreshMemories = async () => {
    if (!walletState.address || !walletState.encryptionKey) return;
    
    setIsLoadingMemories(true);
    try {
      const result = await loadMemories(walletState.address, walletState.encryptionKey);
      if (result.success && result.memories) {
        setMemories(result.memories);
      }
      const count = await getMemoryCount(walletState.address);
      setMemoryCount(count);
    } catch (error) {
      console.error('Failed to refresh memories:', error);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const handleViewMemory = (memory: Memory) => {
    setViewingMemory(memory);
  };

  const handleLoadMemoryAsContext = (memory: Memory) => {
    // Add memory to active context if not already there
    setActiveMemoryContext((prev) => {
      const exists = prev.some((m) => m.cid === memory.cid);
      if (exists) return prev;
      // Keep only the last 5 memories as context to avoid token limits
      const updated = [...prev, memory].slice(-5);
      return updated;
    });
    // Close the viewer if open
    setViewingMemory(null);
  };

  const handleRemoveFromContext = (cid: string) => {
    setActiveMemoryContext((prev) => prev.filter((m) => m.cid !== cid));
  };

  // Send message to AI
  const handleSendMessage = async (content: string) => {
    if (!walletState.isConnected || !activeSession || !walletState.address) return;

    // Clear any previous errors
    setRateLimitError(null);

    // Check if API key is configured
    if (!userApiKey) {
      setRateLimitError('Please add your Groq API key in Settings to use the AI chat. Get a free key at console.groq.com');
      setShowSettings(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Update session with user message
    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      updatedAt: Date.now(),
    };
    updateSession(walletState.address, updatedSession);
    refreshSessions();

    setIsAiLoading(true);

    try {
      // ONLY use memory context if explicitly loaded by user (no auto-fallback)
      // This prevents context poisoning - memories are only used when user clicks "Load as Context"
      const contextMemories = activeMemoryContext.length > 0 
        ? activeMemoryContext 
        : []; // Empty array = no memory context unless explicitly loaded

      // Call AI API with Groq - use session's persona/model config
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: updatedSession.messages,
          memoryContext: contextMemories.length > 0 ? contextMemories : undefined, // Only send if explicitly loaded
          userApiKey: userApiKey,
          selectedModel: activeSession.modelId || 'llama-3.3-70b-versatile', // Use session's model
          personaId: activeSession.personaId || 'default', // Use session's persona
          customSystemPrompt: activeSession.customPrompt, // Use session's custom prompt
        }),
      });

      const data = await response.json();

      // Check if API key is required
      if (response.status === 401 && data.requiresApiKey) {
        setRateLimitError(data.message);
        setShowSettings(true);
        // Remove the user message since AI couldn't respond
        updateSession(walletState.address, activeSession);
        refreshSessions();
        setIsAiLoading(false);
        return;
      }

      // Check for rate limit (informational)
      if (response.status === 429) {
        setRateLimitError(data.error || 'Rate limit reached. Please wait a moment.');
        // Remove the user message since AI couldn't respond
        updateSession(walletState.address, activeSession);
        refreshSessions();
        setIsAiLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Add AI response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      // Update session with AI response
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: Date.now(),
      };
      updateSession(walletState.address, finalSession);
      refreshSessions();

    } catch (error) {
      console.error('AI error:', error);
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      
      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updatedAt: Date.now(),
      };
      updateSession(walletState.address, errorSession);
      refreshSessions();
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save error state
  const [saveError, setSaveError] = useState<string | null>(null);

  // Save session to blockchain
  const handleSaveToMemory = async (sessionId?: string) => {
    const targetSessionId = sessionId || activeSessionId;
    if (!walletState.encryptionKey || !walletState.address || !targetSessionId) return;

    const session = getSessionById(walletState.address, targetSessionId);
    if (!session || session.messages.length === 0) return;

    setIsSaving(true);
    setSavingSessionId(targetSessionId);
    setSaveError(null);

    try {
      // Convert session to conversation format
      const conversation = {
        id: session.id,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        title: session.title,
      };

      const result = await saveMemory(
        conversation,
        walletState.encryptionKey,
        walletState.address
      );

      if (result.success && result.cid) {
        // Mark session as saved
        markSessionAsSaved(walletState.address, targetSessionId, result.cid, result.txHash);
        refreshSessions();

        // Refresh memories and count
        const memoriesResult = await loadMemories(walletState.address, walletState.encryptionKey);
        if (memoriesResult.success && memoriesResult.memories) {
          setMemories(memoriesResult.memories);
        }

        const count = await getMemoryCount(walletState.address);
        setMemoryCount(count);

        // Refresh balance
        const balance = await getUSDCBalance(walletState.address);
        setWalletState((prev) => ({ ...prev, balance }));
      } else if (result.error) {
        setSaveError(result.error);
        // Auto-clear error after 5 seconds
        setTimeout(() => setSaveError(null), 5000);
      }
    } catch (error: unknown) {
      console.error('Save error:', error);
      
      // Extract error message
      const errorObj = error as { message?: string; code?: string };
      let errorMessage = 'Failed to save memory. Please try again.';
      
      if (errorObj.message) {
        errorMessage = errorObj.message;
      }
      
      // Check for user rejection (shouldn't show as error, just cancelled)
      if (errorObj.code === 'USER_REJECTED' || 
          errorObj.message?.includes('cancelled') ||
          errorObj.message?.includes('rejected')) {
        // Don't show error for user cancellation, just silently stop
        console.log('User cancelled the transaction');
      } else {
        setSaveError(errorMessage);
        // Auto-clear error after 5 seconds
        setTimeout(() => setSaveError(null), 5000);
      }
    } finally {
      setIsSaving(false);
      setSavingSessionId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="glass border-b border-zinc-800/50 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-lg text-zinc-100">
              De
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">DeMemo</h1>
              <p className="text-xs text-zinc-500">Decentralized AI Memory</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {walletState.isConnected && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <span className="text-xs text-zinc-400">
                  {memoryCount} memor{memoryCount !== 1 ? 'ies' : 'y'} saved
                </span>
              </div>
            )}
            <WalletConnect
              walletState={walletState}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isLoading={isConnecting}
              error={connectError}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* Security: Only show chat interface if wallet is connected AND authenticated (has encryption key) */}
      {walletState.isConnected && walletState.encryptionKey && walletState.address ? (
        <main className="flex-1 flex overflow-hidden">
          {/* Session Sidebar */}
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onSaveToMemory={handleSaveToMemory}
            isSaving={isSaving}
            savingSessionId={savingSessionId}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onOpenSettings={() => setShowSettings(true)}
            hasApiKey={!!userApiKey}
            memories={memories}
            isLoadingMemories={isLoadingMemories}
            onRefreshMemories={handleRefreshMemories}
            onViewMemory={handleViewMemory}
            onLoadMemoryAsContext={handleLoadMemoryAsContext}
          />

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatInterface
              session={activeSession}
              onSendMessage={handleSendMessage}
              isLoading={isAiLoading}
              memories={memories}
              activeMemoryContext={activeMemoryContext}
              onRemoveFromContext={handleRemoveFromContext}
              isConnected={walletState.isConnected}
              onSaveToMemory={() => handleSaveToMemory()}
              isSaving={isSaving}
              saveError={saveError}
              rateLimitError={rateLimitError}
              hasApiKey={!!userApiKey}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
        </main>
      ) : (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="max-w-6xl mx-auto px-4 py-20">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-sm mb-6">
                <Zap className="w-4 h-4" />
                <span>Powered by Arc Network & IPFS</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-bold text-zinc-100 mb-6 leading-tight">
                Your AI Memory.
                <br />
                <span className="text-zinc-400">
                  Decentralized.
                </span>
              </h2>
              
              <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10">
                Chat freely, save what matters. Your conversations are encrypted and stored on IPFS.
                Only pay for memories you want to keep forever.
              </p>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-100 text-zinc-900 text-lg font-semibold rounded-xl hover:bg-white transition-all"
              >
                <span>{isConnecting ? 'Connecting...' : 'Get Started'}</span>
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-20">
              <div className="group p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  Chat Free, Pay to Save
                </h3>
                <p className="text-zinc-500 text-sm">
                  Create unlimited chat sessions locally. Only pay 0.01 USDC when you want to save a conversation forever.
                </p>
              </div>

              <div className="group p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  Encrypted & Portable
                </h3>
                <p className="text-zinc-500 text-sm">
                  Your saved memories are encrypted with your wallet key and stored on IPFS. Access them anywhere.
                </p>
              </div>

              <div className="group p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  AI That Remembers
                </h3>
                <p className="text-zinc-500 text-sm">
                  Your saved memories give the AI context. The more you save, the more personalized it becomes.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="max-w-4xl mx-auto px-4 py-20">
            <h3 className="text-3xl font-semibold text-zinc-100 text-center mb-12">
              How It Works
            </h3>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Connect Your Wallet',
                  description: 'Use MetaMask or Circle Wallet. Your wallet becomes your identity and encryption key.',
                },
                {
                  step: '02',
                  title: 'Chat Freely',
                  description: 'Create unlimited chat sessions. They\'re saved locally in your browser—no cost.',
                },
                {
                  step: '03',
                  title: 'Save What Matters',
                  description: 'Found a great conversation? Click "Save to Memory" and pay 0.01 USDC to store it forever.',
                },
                {
                  step: '04',
                  title: 'AI Gets Smarter',
                  description: 'Your saved memories give the AI context about you. It learns and remembers.',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex gap-6 items-start p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-zinc-400 font-mono text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-zinc-100 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-zinc-500 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600">
            Built for the Arc Network Hackathon
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <span>Arc Network</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Wallet Selector Modal */}
      {showWalletSelector && (
        <WalletSelector
          onSelectMetaMask={handleConnectMetaMask}
          onSelectCircle={handleConnectCircle}
          isLoading={isConnecting}
          onClose={() => {
            setShowWalletSelector(false);
            // Security: Clear any partial connection state if user cancels
            // Only clear if not fully authenticated (no encryption key)
            if (!walletState.encryptionKey) {
              setWalletState({
                address: null,
                isConnected: false,
                chainId: null,
                balance: null,
                encryptionKey: null,
              });
              setWalletType(null);
            }
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && walletState.address && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => {
            setShowSettings(false);
            // Reload settings
            const settings = getSettings(walletState.address!);
            setUserApiKey(settings.groqApiKey || '');
            // Clear rate limit error when user might have added a key
            setRateLimitError(null);
          }}
          walletAddress={walletState.address}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && walletState.address && (
        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          onCreateChat={handleCreateSessionWithConfig}
          walletAddress={walletState.address}
        />
      )}

      {/* Memory Viewer Modal */}
      <MemoryViewer
        memory={viewingMemory}
        isOpen={!!viewingMemory}
        onClose={() => setViewingMemory(null)}
        onLoadAsContext={handleLoadMemoryAsContext}
      />
    </div>
  );
}
