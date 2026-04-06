/**
 * Grok agent — fetches trending / upcoming regulations using LangChain.
 *
 * Chain: ChatPromptTemplate | ChatOpenAI (Grok via OpenRouter) | JsonOutputParser
 */
import { ChatPromptTemplate }  from '@langchain/core/prompts';
import { JsonOutputParser }    from '@langchain/core/output_parsers';
import { buildModel }          from '../llm';
import { RegGuardConfig, Regulation } from '../types';

const SYSTEM = `You are a regulatory trend analyst with deep knowledge of emerging laws and compliance deadlines.
Return ONLY a valid JSON array — no markdown, no backticks, no explanation.`;

const HUMAN = `Identify TRENDING and UPCOMING regulations affecting this product in the next 6-12 months.

Product: {productType}
Regions: {regions}
Tools/services: {tools}

Focus on: recently passed bills awaiting enforcement, upcoming compliance deadlines,
major enforcement actions signalling stricter oversight, EU AI Act, US AI executive orders,
new rules around LLMs or automated decision-making, recent data-breach rulings.

Return a JSON array where each item has:
  id, name, description, region, source, trending (always true), trendReason

trendReason must explain WHY it's trending now (e.g. "Takes effect Jan 2026", "Major fine issued Nov 2024").`;

const parser = new JsonOutputParser<Regulation[]>();

export async function findTrendingRegulations(config: RegGuardConfig): Promise<Regulation[]> {
  const model  = buildModel('grok', config.openRouterKey, { temperature: 0.2, maxTokens: 2500 });
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM],
    ['human',  HUMAN],
  ]);

  const chain = prompt.pipe(model).pipe(parser);

  const regions = [...config.releaseRegions, ...config.clientRegions]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ') || 'global';

  const tools = [...config.externalTools, ...config.internalTools]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ') || 'general software stack';

  try {
    const result = await chain.invoke({ productType: config.productType, regions, tools });
    const regs   = Array.isArray(result) ? result : [];
    return regs.map(r => ({ ...r, trending: true }));
  } catch (err) {
    console.error('RegGuard [Grok chain] error:', err);
    return [];
  }
}
