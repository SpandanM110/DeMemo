'use client';

import { useState } from 'react';
import { X, MessageSquare, Cpu, User, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/lib/models';
import { PRESET_PERSONAS, DEFAULT_PERSONA, getAllPersonas, type AIPersona } from '@/lib/personas';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (config: {
    personaId: string;
    modelId: string;
    customPrompt?: string;
  }) => void;
  walletAddress: string;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onCreateChat,
  walletAddress,
}: NewChatModalProps) {
  const [selectedPersona, setSelectedPersona] = useState(DEFAULT_PERSONA);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);

  // Get all personas (preset + custom)
  const allPersonas = walletAddress ? getAllPersonas(walletAddress) : PRESET_PERSONAS;

  const handleCreate = () => {
    onCreateChat({
      personaId: selectedPersona,
      modelId: selectedModel,
      customPrompt: customPrompt.trim() || undefined,
    });
    // Reset for next time
    setSelectedPersona(DEFAULT_PERSONA);
    setSelectedModel(DEFAULT_MODEL);
    setCustomPrompt('');
    setShowAdvanced(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentPersona = allPersonas.find(p => p.id === selectedPersona);
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">New Chat</h2>
              <p className="text-xs text-zinc-500">Choose how you want to chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Persona Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <User className="w-4 h-4" />
              Choose AI Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allPersonas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPersona === persona.id
                      ? 'bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/30'
                      : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{persona.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        selectedPersona === persona.id ? 'text-zinc-100' : 'text-zinc-300'
                      }`}>
                        {persona.name}
                      </p>
                      {persona.isCustom && (
                        <span className="text-[10px] text-teal-400">Custom</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Persona Preview */}
            {currentPersona && (
              <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{currentPersona.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{currentPersona.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{currentPersona.description}</p>
                    <button
                      onClick={() => setExpandedPersona(expandedPersona === currentPersona.id ? null : currentPersona.id)}
                      className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 mt-2"
                    >
                      {expandedPersona === currentPersona.id ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide prompt
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          View prompt
                        </>
                      )}
                    </button>
                    {expandedPersona === currentPersona.id && (
                      <pre className="mt-2 p-2 bg-zinc-900 rounded text-xs text-zinc-500 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {currentPersona.systemPrompt}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Cpu className="w-4 h-4" />
              Choose AI Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedModel === model.id
                      ? 'bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/30'
                      : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    selectedModel === model.id ? 'text-zinc-100' : 'text-zinc-300'
                  }`}>
                    {model.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{model.provider}</p>
                </button>
              ))}
            </div>
            {currentModel && (
              <p className="text-xs text-zinc-500 px-1">
                {currentModel.description}
              </p>
            )}
          </div>

          {/* Advanced Options */}
          <div className="border-t border-zinc-800 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Advanced options</span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-3">
                <label className="text-xs text-zinc-500">
                  Custom instructions (optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add extra instructions for this chat only..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none"
                />
                <p className="text-xs text-zinc-600">
                  These instructions will be added to the persona&apos;s prompt for this chat session.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}
