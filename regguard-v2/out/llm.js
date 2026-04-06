"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildModel = buildModel;
/**
 * LangChain model factory
 * All three agents share this factory — one OpenRouter key, three models.
 * ChatOpenAI supports custom baseURL so we point it at OpenRouter directly.
 */
const openai_1 = require("@langchain/openai");
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL_IDS = {
    perplexity: 'perplexity/llama-3.1-sonar-large-128k-online',
    grok: 'x-ai/grok-2-1212',
    claude: 'anthropic/claude-3.5-sonnet',
};
/**
 * Returns a ChatOpenAI instance configured to call the given agent model
 * via OpenRouter. Temperature and maxTokens are per-agent defaults.
 */
function buildModel(agent, openRouterKey, opts = {}) {
    return new openai_1.ChatOpenAI({
        modelName: MODEL_IDS[agent],
        openAIApiKey: openRouterKey,
        temperature: opts.temperature ?? 0.1,
        maxTokens: opts.maxTokens ?? 2048,
        configuration: {
            baseURL: OPENROUTER_BASE,
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/regguard/regguard',
                'X-Title': 'RegGuard VS Code Extension',
            },
        },
    });
}
//# sourceMappingURL=llm.js.map