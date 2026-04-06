"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = invalidateCache;
exports.scanDocument = scanDocument;
const vscode = __importStar(require("vscode"));
const perplexityAgent_1 = require("./agents/perplexityAgent");
const grokAgent_1 = require("./agents/grokAgent");
const claudeAgent_1 = require("./agents/claudeAgent");
// ── Regulation cache (30 min TTL — regs don't change every scan) ─────────────
let regCache = null;
let trendingCache = null;
let cacheTs = null;
const CACHE_TTL = 30 * 60 * 1000;
function invalidateCache() {
    regCache = trendingCache = cacheTs = null;
}
// ── Main scan entry point ─────────────────────────────────────────────────────
async function scanDocument(document, config, diagnosticsProvider, sidebarProvider) {
    sidebarProvider.setScanning(true, 'Fetching regulations…');
    try {
        // 1. Fetch / use cached regulations
        const now = Date.now();
        if (!cacheTs || now - cacheTs > CACHE_TTL || !regCache || !trendingCache) {
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'RegGuard', cancellable: false }, async (p) => {
                p.report({ message: 'Fetching current regulations (Perplexity)…' });
                regCache = await (0, perplexityAgent_1.findRegulations)(config);
                p.report({ message: 'Fetching trending regulations (Grok)…' });
                trendingCache = await (0, grokAgent_1.findTrendingRegulations)(config);
                cacheTs = Date.now();
            });
        }
        const regulations = regCache ?? [];
        const trendingRegs = trendingCache ?? [];
        // 2. Analyse the document with Claude
        sidebarProvider.setScanning(true, 'Analysing code (Claude)…');
        const shortName = document.fileName.split(/[\\/]/).pop() ?? document.fileName;
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'RegGuard', cancellable: false }, async (p) => {
            p.report({ message: `Analysing ${shortName}…` });
            const findings = await (0, claudeAgent_1.analyzeCode)(document.getText(), document.fileName, document.languageId, regulations, trendingRegs, config.openRouterKey);
            diagnosticsProvider.setFindings(document, findings);
            // Push all findings across all open files to the sidebar
            const allFindings = Array.from(diagnosticsProvider.getAllFindings().entries()).map(([uri, flist]) => ({
                uri,
                fileName: uri.split(/[\\/]/).pop() ?? uri,
                findings: flist
            }));
            sidebarProvider.updateFindings(allFindings);
            const n = findings.length;
            if (n === 0) {
                vscode.window.showInformationMessage(`RegGuard ✓ No compliance issues in ${shortName}`);
            }
            else {
                vscode.window.showWarningMessage(`RegGuard: ${n} issue${n !== 1 ? 's' : ''} in ${shortName}. See Problems panel or sidebar.`);
            }
        });
    }
    catch (err) {
        sidebarProvider.setScanning(false);
        vscode.window.showErrorMessage(`RegGuard error: ${err?.message ?? err}`);
        throw err;
    }
}
//# sourceMappingURL=scanner.js.map