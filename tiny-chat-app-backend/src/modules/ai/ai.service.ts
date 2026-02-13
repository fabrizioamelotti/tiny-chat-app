import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';

type AiConfig = {
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

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };

export type AiChatOptions = {
  sessionId: string;
  message: string;
  systemInstruction?: string;
  useRag?: boolean;
  useWebSearch?: boolean;
};

export type AiChatResult = {
  sessionId: string;
  model: string;
  reply: string;
  messagesInMemory: number;
  ragSources: Array<{ source: string; line: number }>;
  webSources: Array<{ title: string; link: string; snippet: string }>;
};

type LocalContextSnippet = {
  score: number;
  source: string;
  line: number;
  text: string;
};

type WebSearchResult = { title: string; link: string; snippet: string };

const RAG_STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'because',
  'before',
  'between',
  'could',
  'compare',
  'from',
  'have',
  'here',
  'internal',
  'into',
  'just',
  'like',
  'many',
  'more',
  'most',
  'notes',
  'online',
  'only',
  'other',
  'our',
  'over',
  'same',
  'should',
  'some',
  'than',
  'that',
  'their',
  'there',
  'these',
  'they',
  'this',
  'tips',
  'very',
  'what',
  'when',
  'where',
  'which',
  'with',
  'would',
  'your',
]);

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  private readonly conversations = new Map<string, ChatMessage[]>();

  private get aiConfig(): AiConfig {
    return this.configService.get<AiConfig>('ai') as AiConfig;
  }

  private tokenize(input: string): string[] {
    return (input || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private listRagFiles(ragDirPath: string): string[] {
    if (!fs.existsSync(ragDirPath)) return [];
    if (!fs.statSync(ragDirPath).isDirectory()) return [];

    const files: string[] = [];
    const stack: string[] = [ragDirPath];

    while (stack.length > 0) {
      const current = stack.pop() as string;
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }
        if (entry.isFile()) files.push(fullPath);
      }
    }

    return files;
  }

  private retrieveLocalContext(
    query: string,
    ragDirPath: string,
  ): LocalContextSnippet[] {
    const { ragMaxFileBytes, ragTopK } = this.aiConfig;

    const rawQueryTokens = this.tokenize(query);
    const filteredQueryTokens = rawQueryTokens.filter(
      (token) => !RAG_STOP_WORDS.has(token),
    );
    const queryTokens = new Set(
      filteredQueryTokens.length > 0 ? filteredQueryTokens : rawQueryTokens,
    );
    if (queryTokens.size === 0) return [];

    const scoredSnippets: LocalContextSnippet[] = [];
    const files = this.listRagFiles(ragDirPath);

    for (const filePath of files) {
      try {
        const size = fs.statSync(filePath).size;
        if (size > ragMaxFileBytes) continue;

        const rawContent = fs.readFileSync(filePath, 'utf8');
        const lines = rawContent.split('\n');
        const source = path.relative(process.cwd(), filePath);
        const sourceTokens = new Set(
          this.tokenize(source.replace(/[\\/._-]/g, ' ')),
        );

        for (let index = 0; index < lines.length; index++) {
          const line = lines[index]?.trim();
          if (!line) continue;

          const preview = lines
            .slice(index, index + 3)
            .join('\n')
            .trim();
          const previewTokens = new Set(this.tokenize(preview));
          const overlapTokens = [...queryTokens].filter((token) =>
            previewTokens.has(token),
          );
          if (overlapTokens.length === 0) continue;

          const sourceOverlap = overlapTokens.filter((token) =>
            sourceTokens.has(token),
          ).length;
          let score = overlapTokens.length * 3 + sourceOverlap * 2;
          if (/knowledge\.txt$/i.test(filePath)) score -= 1;

          scoredSnippets.push({
            score,
            source,
            line: index + 1,
            text: preview,
          });
        }
      } catch {
        continue;
      }
    }

    return scoredSnippets.sort((a, b) => b.score - a.score).slice(0, ragTopK);
  }

  private buildContextBlock(
    localContext: LocalContextSnippet[],
    webResults: WebSearchResult[],
  ): string {
    const blocks: string[] = [];

    if (localContext.length > 0) {
      const localBlock = localContext
        .map(
          (item, index) =>
            `[LOCAL ${index + 1}] ${item.source}:${item.line}\n${item.text}`,
        )
        .join('\n\n');
      blocks.push(`Local project context:\n${localBlock}`);
    }

    if (webResults.length > 0) {
      const webBlock = webResults
        .map(
          (item, index) =>
            `[WEB ${index + 1}] ${item.title}\nURL: ${item.link}\nSummary: ${item.snippet}`,
        )
        .join('\n\n');
      blocks.push(`Internet search context:\n${webBlock}`);
    }

    return blocks.join('\n\n');
  }

  private async searchInternet(query: string): Promise<WebSearchResult[]> {
    const { webSearchTopK } = this.aiConfig;
    const safeQuery = (query || '').trim();
    if (!safeQuery) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      // Prefer DuckDuckGo instant answer API (JSON, no scraping).
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
        safeQuery,
      )}&format=json&no_redirect=1&no_html=1`;

      const ddgResponse = await fetch(ddgUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'tiny-chat-app/1.0',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (ddgResponse.ok) {
        const ddg = await ddgResponse.json();
        const out: WebSearchResult[] = [];

        const topics = Array.isArray(ddg?.RelatedTopics)
          ? ddg.RelatedTopics
          : [];
        for (const topic of topics) {
          if (out.length >= webSearchTopK) break;

          if (topic?.Text && topic?.FirstURL) {
            out.push({
              title:
                String(topic.Text).split(' - ')[0] ||
                'DuckDuckGo Related Topic',
              link: String(topic.FirstURL),
              snippet: String(topic.Text),
            });
            continue;
          }

          if (Array.isArray(topic?.Topics)) {
            for (const nestedTopic of topic.Topics) {
              if (out.length >= webSearchTopK) break;
              if (nestedTopic?.Text && nestedTopic?.FirstURL) {
                out.push({
                  title:
                    String(nestedTopic.Text).split(' - ')[0] ||
                    'DuckDuckGo Related Topic',
                  link: String(nestedTopic.FirstURL),
                  snippet: String(nestedTopic.Text),
                });
              }
            }
          }
        }

        if (out.length > 0) return out.slice(0, webSearchTopK);
      }
    } catch {
      // Continue to Wikipedia fallback.
    } finally {
      clearTimeout(timeout);
    }

    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 10_000);

    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        safeQuery,
      )}&format=json&utf8=1&srlimit=${webSearchTopK}`;

      const wikiResponse = await fetch(wikiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'tiny-chat-app/1.0',
          Accept: 'application/json',
        },
        signal: controller2.signal,
      });

      if (!wikiResponse.ok) return [];

      const data = await wikiResponse.json();
      const results = Array.isArray(data?.query?.search)
        ? data.query.search
        : [];
      return results
        .map((item: any) => {
          const title = String(item?.title || '').trim();
          const rawSnippet = String(item?.snippet || '');
          const snippet = rawSnippet
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          return {
            title,
            link: `https://en.wikipedia.org/wiki/${encodeURIComponent(
              title.replace(/\s+/g, '_'),
            )}`,
            snippet,
          };
        })
        .filter((item: WebSearchResult) => item.title && item.link)
        .slice(0, webSearchTopK);
    } catch {
      return [];
    } finally {
      clearTimeout(timeout2);
    }
  }

  clearSession(sessionId: string): boolean {
    return this.conversations.delete(sessionId);
  }

  async chat(options: AiChatOptions): Promise<AiChatResult> {
    const {
      enabled,
      apiBaseUrl,
      apiKey,
      model,
      timeoutMs,
      systemPrompt,
      maxTokens,
      temperature,
      maxHistoryMessages,
      enableRag,
      enableWebSearch,
    } = this.aiConfig;

    if (!enabled) {
      throw new ServiceUnavailableException(
        'AI is disabled. Set AI_ENABLED=true to enable it.',
      );
    }

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI API key is missing. Set AI_API_KEY in the environment.',
      );
    }

    const sessionId = (options.sessionId || '').trim() || 'default';
    const message = (options.message || '').trim();
    const systemInstruction =
      typeof options.systemInstruction === 'string'
        ? options.systemInstruction.trim()
        : '';

    const useRag = options.useRag ?? enableRag;
    const useWebSearch = options.useWebSearch ?? enableWebSearch;

    const history = this.conversations.get(sessionId) || [];
    const conversationMessages: ChatMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    const ragDirPath = path.join(process.cwd(), 'rag');
    const localContext = useRag
      ? this.retrieveLocalContext(message, ragDirPath)
      : [];
    const webResults = useWebSearch ? await this.searchInternet(message) : [];
    const contextBlock = this.buildContextBlock(localContext, webResults);

    const finalSystemInstruction = [
      systemPrompt,
      systemInstruction,
      contextBlock
        ? `Use the following context when relevant:\n\n${contextBlock}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const endpointUrl = apiBaseUrl.endsWith('/chat/completions')
      ? apiBaseUrl
      : `${apiBaseUrl.replace(/\/$/, '')}/chat/completions`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: 'system', content: finalSystemInstruction },
            ...conversationMessages,
          ],
        }),
        signal: controller.signal,
      });

      const data = (await response.json()) as OpenAIChatCompletionResponse;

      if (!response.ok) {
        const message =
          data?.error?.message ??
          `AI request failed with status ${response.status} ${response.statusText}`;
        throw new BadGatewayException(message);
      }

      const modelText = data?.choices?.[0]?.message?.content?.trim() || '';
      if (!modelText) {
        throw new BadGatewayException('AI did not return text.');
      }

      const updatedHistory: ChatMessage[] = [
        ...conversationMessages,
        { role: 'assistant' as const, content: modelText },
      ].slice(-maxHistoryMessages);
      this.conversations.set(sessionId, updatedHistory);

      return {
        sessionId,
        model,
        reply: modelText,
        messagesInMemory: updatedHistory.length,
        ragSources: localContext.map((item) => ({
          source: item.source,
          line: item.line,
        })),
        webSources: webResults.map((item) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        })),
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new BadGatewayException('AI request failed.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
