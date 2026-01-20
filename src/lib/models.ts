/**
 * Available AI Models for DeMemo
 * Using Groq's API with multiple model options
 */

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description: 'Best for general tasks, highly capable',
    provider: 'Meta',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Fast responses, good for quick tasks',
    provider: 'Meta',
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    description: 'Latest Llama 4, balanced performance',
    provider: 'Meta',
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    description: 'Extended context, creative tasks',
    provider: 'Meta',
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    description: 'Strong reasoning and multilingual',
    provider: 'Alibaba',
  },
  {
    id: 'moonshotai/kimi-k2-instruct-0905',
    name: 'Kimi K2 Instruct',
    description: 'Good for instructions and coding',
    provider: 'Moonshot AI',
  },
];

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
