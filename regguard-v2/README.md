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

## Development

```bash
git clone <repo>
cd regguard
npm install
npm run compile
# Press F5 in VS Code to launch extension in debug mode
```
