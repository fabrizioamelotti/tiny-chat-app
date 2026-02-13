import { ENV } from '../basic/constants/basic.constants';
import { demandEnv } from '../utils/utils';

type EnvironmentConfigurationsType = {
  env: string;
  port: number;
  version: string;
  ai: {
    enabled: boolean;
    apiBaseUrl: string;
    apiKey?: string;
    model: string;
    timeoutMs: number;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
    maxHistoryMessages: number;
    enableRag: boolean;
    enableWebSearch: boolean;
    ragTopK: number;
    webSearchTopK: number;
    ragMaxFileBytes: number;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
};

export default (): EnvironmentConfigurationsType => {
  const aiEnabled =
    (process.env[ENV.AI_ENABLED] ?? 'false').toLowerCase() === 'true';

  return {
    env: demandEnv(ENV.ENV),
    port: Number.parseInt(demandEnv(ENV.PORT), 10),
    version: demandEnv(ENV.VERSION),
    ai: {
      enabled: aiEnabled,
      apiBaseUrl: demandEnv(
        ENV.AI_API_BASE_URL,
        'https://router.huggingface.co/v1/chat/completions',
      ),
      apiKey: aiEnabled
        ? demandEnv(ENV.AI_API_KEY)
        : process.env[ENV.AI_API_KEY],
      model: 'Qwen/Qwen2.5-7B-Instruct',
      timeoutMs: 20000,
      systemPrompt:
        'You are a helpful and accurate assistant. If context is provided, prioritize it and clearly say when information is uncertain. If internet search context is present, answer from that context and never use knowledge-cutoff disclaimers like "as of my last update". If local context is present and the user asks about internal/project notes, use local context first and do not claim that internal notes are missing unless local context is empty. If context is insufficient, say so explicitly.',
      maxTokens: 512,
      temperature: 0.7,
      maxHistoryMessages: 20,
      enableRag: true,
      enableWebSearch: true,
      ragTopK: 3,
      webSearchTopK: 3,
      ragMaxFileBytes: 120000,
    },
    throttle: {
      ttl: Number.parseInt(demandEnv(ENV.THROTTLE_TTL), 10),
      limit: Number.parseInt(demandEnv(ENV.THROTTLE_LIMIT), 10),
    },
  };
};
