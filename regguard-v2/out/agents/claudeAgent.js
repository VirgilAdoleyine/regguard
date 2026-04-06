"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCode = analyzeCode;
/**
 * Claude agent — analyses code for compliance issues using LangChain.
 *
 * Chain: ChatPromptTemplate | ChatOpenAI (Claude via OpenRouter) | JsonOutputParser
 *
 * Uses a two-message prompt:
 *   system — sets the role and strict JSON-only output rule
 *   human  — provides the regulations summary + code
 */
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const llm_1 = require("../llm");
const SYSTEM = `You are an expert compliance code auditor.
Return ONLY a valid JSON array of findings — no markdown, no backticks, no explanation.
If there are no issues return [].`;
const HUMAN = `Analyse this {language} file for regulatory violations.

File: {fileName}{truncationNote}

APPLICABLE REGULATIONS:
{regSummary}

CODE:
\`\`\`{language}
{code}
\`\`\`

For every non-compliant line or block return a JSON object:
{{
  "id":           "finding-001",
  "line":         12,
  "endLine":      15,
  "startChar":    0,
  "endChar":      80,
  "severity":     "error | warning | info",
  "message":      "1-2 sentence description of the compliance issue",
  "regulation":   {{ "id":"...", "name":"...", "description":"...", "region":"...", "trending":false, "trendReason":"" }},
  "proposedFix":  "Complete corrected code replacing lines line-endLine (valid, preserves indentation)",
  "fixDescription": "What the fix does and why it satisfies the regulation",
  "originalCode": "The exact original lines being replaced"
}}

Rules:
- line / endLine are 1-indexed
- severity: error = clear violation now, warning = risk/best-practice gap, info = future/trending concern
- proposedFix must be a complete, valid, drop-in replacement
- Flag ONLY genuine compliance issues — not general code quality
- Return ONLY the JSON array`;
const parser = new output_parsers_1.JsonOutputParser();
async function analyzeCode(code, fileName, language, regulations, trendingRegs, openRouterKey) {
    const allRegs = [...regulations, ...trendingRegs];
    if (allRegs.length === 0 || !code.trim()) {
        return [];
    }
    // Truncate files > 800 lines to stay within token limits
    const lines = code.split('\n');
    const truncated = lines.length > 800;
    const codeSlice = truncated ? lines.slice(0, 800).join('\n') : code;
    const truncNote = truncated ? `\n(File has ${lines.length} lines — only first 800 shown)` : '';
    const regSummary = allRegs.map(r => `- [${r.id}] ${r.name} (${r.region}): ${r.description}` +
        (r.trending ? `\n  TRENDING: ${r.trendReason ?? ''}` : '')).join('\n');
    const model = (0, llm_1.buildModel)('claude', openRouterKey, { temperature: 0.1, maxTokens: 4096 });
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', SYSTEM],
        ['human', HUMAN],
    ]);
    const chain = prompt.pipe(model).pipe(parser);
    try {
        const findings = await chain.invoke({
            language,
            fileName,
            truncationNote: truncNote,
            regSummary,
            code: codeSlice,
        });
        if (!Array.isArray(findings)) {
            return [];
        }
        // Claude returns 1-indexed lines; VS Code uses 0-indexed
        return findings.map(f => ({
            ...f,
            id: f.id || `finding-${Math.random().toString(36).slice(2, 8)}`,
            line: Math.max(0, (f.line ?? 1) - 1),
            endLine: Math.max(0, (f.endLine ?? f.line ?? 1) - 1),
            startChar: f.startChar ?? 0,
            endChar: f.endChar ?? 999,
        }));
    }
    catch (err) {
        console.error('RegGuard [Claude chain] error:', err);
        return [];
    }
}
//# sourceMappingURL=claudeAgent.js.map