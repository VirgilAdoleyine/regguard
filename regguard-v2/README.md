# RegGuard — AI Compliance Co-Pilot for VS Code

RegGuard scans your code against real regulations for your product type, release regions, and tools — and flags issues with line-level precision. Accept or decline Claude's proposed fixes without leaving your editor.

---

## How it works

1. **Perplexity** searches for current regulations applicable to your product, regions, and tools
2. **Grok** surfaces trending and upcoming regulatory changes in the next 6–12 months
3. **Claude** reads your code, flags non-compliant lines/blocks, and proposes drop-in fixes

All three models are accessed through a **single OpenRouter API key** — no separate subscriptions needed.

---

## Setup

### 1. Get an OpenRouter key
Sign up free at [openrouter.ai](https://openrouter.ai) and copy your API key.

### 2. Configure RegGuard
Open VS Code Settings (`Ctrl/Cmd + ,`) and search for `regguard`:

| Setting | Example |
|---|---|
| `regguard.openRouterKey` | `sk-or-v1-...` |
| `regguard.productType` | `"fintech mobile app"` |
| `regguard.releaseRegions` | `["EU", "US", "UK"]` |
| `regguard.clientRegions` | `["EU", "US"]` |
| `regguard.externalTools` | `["Stripe", "Twilio", "AWS S3"]` |
| `regguard.internalTools` | `["React", "Node.js", "PostgreSQL"]` |
| `regguard.scanOnSave` | `true` or `false` |

### 3. Scan
- **Command Palette** → `RegGuard: Scan current file`
- **Right-click** any file → `RegGuard: Scan current file`
- **Sidebar** → Click the shield icon → click **Scan**
- **Auto** → Enable `regguard.scanOnSave` to scan on every save

---

## Using findings

Flags appear as squiggly underlines just like ESLint errors. You can:
- **Hover** over the squiggly to read the regulation and issue summary
- **Click the lightbulb** (or `Ctrl/Cmd + .`) to open the quick-fix menu
- **Apply fix** — Claude rewrites the flagged block in place
- **Decline** — dismiss the flag
- **View details** — opens a full regulation panel beside your editor

The **RegGuard sidebar** (shield icon in the Activity Bar) shows all findings across all open files with jump-to-line and apply-fix buttons.

---

## Commands

| Command | Description |
|---|---|
| `RegGuard: Scan current file` | Scan the active editor |
| `RegGuard: Scan workspace` | Scan all open files |
| `RegGuard: Clear all flags` | Remove all RegGuard diagnostics |
| `RegGuard: Refresh regulations cache` | Force re-fetch regulations from Perplexity & Grok |
| `RegGuard: Open configuration` | Jump to RegGuard settings |

---

## Regulation cache

Regulations are cached for **30 minutes** to save API credits. If your product config changes, use `RegGuard: Refresh regulations cache` or change any setting (the cache clears automatically).

---

## Cost estimate

A typical scan uses approximately:
- ~2 000 tokens (Perplexity) — regulation fetch
- ~1 500 tokens (Grok) — trending fetch
- ~3 000–8 000 tokens (Claude) — code analysis, scales with file size

On OpenRouter free tier / pay-as-you-go this is a few cents per scan. Regulation results are cached for 30 minutes so repeated scans of different files only re-spend the Claude analysis tokens.

---

## Privacy

Your code is sent to Claude via OpenRouter. Regulations context is sent to Perplexity and Grok. Review OpenRouter's and each model provider's privacy policies before scanning proprietary code.

---

## VibeFlow — AI Workflow Builder

Build automation workflows from plain English. Claude + Gemini write, run, and self-heal Python scripts for you.

**By Virgil Junior Adoleyine — 17, 🇬🇭 Ghana**

### Features

- **Natural Language First** — Type what you want, AI builds it
- **Visual Canvas** — React Flow node editor for power users
- **In-Canvas Execution** — Run and test workflows directly without leaving the builder
- **Live Node Editing** — Click and customize any node's logic or integration on the fly
- **Composio Native Setup** — Link 400+ apps directly via the extension
- **4-Node AI Agent** — Planner → Executor → Reflector (self-healer) → Formatter
- **Infinite Self-Healing** — Code retries until fixed, or until you stop it
- **Best Model Search** — Perplexity finds the right model for your task
- **Global Compliance** — Regulations checked via Perplexity + Grok
- **Claude Compliance Fixes** — Auto-patches code to meet regulations
- **Generate .py + .env + README** — Full runnable Python workflow files
- **Dual-Remote Git Sync** — Push to cloud + community repos in one command

### Get Started

1. Install the extension
2. Open Settings → search VibeFlow → add your OpenRouter API key
3. Press Ctrl+Shift+P → VibeFlow: Open Workflow Builder
4. Describe your workflow and watch AI build it

### Want More?

Visit [vibeflow-cloud.vercel.app](https://vibeflow-cloud.vercel.app) for:

- Full visual UI with execution history
- 400+ OAuth integrations (Gmail, Slack, GitHub, Notion...)
- Memory of past workflows
- No-code friendly interface for non-developers

---

## Support RegGuard

This extension is supported by RegGuard — a compliance and regulatory tool for developers to ship faster.

- **GitHub:** [github.com/VirgilAdoleyine/regguard](https://github.com/VirgilAdoleyine/regguard)
- **Marketplace:** Search "RegGuard" on VS Code Marketplace or Open VSX

⭐ **Please star RegGuard to help us grow and support developers worldwide.**

---

## Join the Community

VibeFlow is an open-source mission to empower developers worldwide. By contributing, you help fellow engineers deploy automation faster than ever while ensuring every regulation is met through our AI-driven compliance engine.

### Empower Developers Worldwide

We need your expertise to build the future of compliant automation. Your contributions directly support developers across the globe in shipping safer, faster, and more robust code.

### Fork & Setup

```bash
git clone https://github.com/VirgilAdoleyine/regguard
cd regguard/regguard-v2
npm install
npm run bundle
```

### Contribute

Help us expand regulation coverage, enhance detection accuracy, or add new LLM providers. Submit a PR and help developers everywhere meet global standards with ease.

---

MIT License · Made with ❤️ in Ghana 🇬🇭
