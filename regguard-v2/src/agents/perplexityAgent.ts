/**
 * Perplexity agent — fetches current regulations using LangChain.
 *
 * Chain: ChatPromptTemplate | ChatOpenAI (Perplexity via OpenRouter) | JsonOutputParser
 */
import { ChatPromptTemplate }  from '@langchain/core/prompts';
import { JsonOutputParser }    from '@langchain/core/output_parsers';
import { buildModel }          from '../llm';
import { RegGuardConfig, Regulation } from '../types';

const SYSTEM = `You are a regulatory compliance expert.
Return ONLY a valid JSON array — no markdown, no backticks, no explanation.`;

const HUMAN = `Find all current, active regulations for this product and return them as a JSON array.

Product: {productType}
Release regions: {releaseRegions}
Client/user regions: {clientRegions}
External tools: {externalTools}
Internal frameworks: {internalTools}

Return a JSON array where each item has:
  id, name, description, region, source

Cover: data privacy (GDPR/CCPA/PIPEDA/LGPD/PDPA), payment (PCI-DSS/PSD2/SOX),
healthcare (HIPAA/HITECH), data residency, third-party tool compliance,
accessibility (WCAG/ADA), cybersecurity regulations.
Focus on regulations that are visible in code. ALL regions must be covered.`;

const parser = new JsonOutputParser<Regulation[]>();

export async function findRegulations(config: RegGuardConfig): Promise<Regulation[]> {
  const model  = buildModel('perplexity', config.openRouterKey, { temperature: 0.1, maxTokens: 3000 });
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM],
    ['human',  HUMAN],
  ]);

  const chain = prompt.pipe(model).pipe(parser);

  try {
    const result = await chain.invoke({
      productType:   config.productType,
      releaseRegions: config.releaseRegions.join(', ') || 'global',
      clientRegions:  config.clientRegions.join(', ')  || 'global',
      externalTools:  config.externalTools.join(', ')  || 'none specified',
      internalTools:  config.internalTools.join(', ')  || 'none specified',
    });
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.error('RegGuard [Perplexity chain] error:', err);
    return [];
  }
}
