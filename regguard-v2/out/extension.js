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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
const diagnosticsProvider_1 = require("./providers/diagnosticsProvider");
const codeActionProvider_1 = require("./providers/codeActionProvider");
const sidebarProvider_1 = require("./providers/sidebarProvider");
const scanner_1 = require("./scanner");
function activate(context) {
    // ── Providers ────────────────────────────────────────────────────────────────
    const diagnostics = new diagnosticsProvider_1.DiagnosticsProvider();
    const sidebar = new sidebarProvider_1.SidebarProvider();
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarProvider_1.SidebarProvider.viewType, sidebar), vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, new codeActionProvider_1.CodeActionProvider(diagnostics), { providedCodeActionKinds: codeActionProvider_1.CodeActionProvider.providedCodeActionKinds }), diagnostics);
    // ── Helper: run a scan after validating config ────────────────────────────────
    async function runScan(doc) {
        const target = doc ?? vscode.window.activeTextEditor?.document;
        if (!target) {
            vscode.window.showWarningMessage('RegGuard: Open a file first.');
            return;
        }
        const config = (0, config_1.getConfig)();
        const err = (0, config_1.validateConfig)(config);
        if (err) {
            const choice = await vscode.window.showErrorMessage(err, 'Open Settings');
            if (choice === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'regguard');
            }
            return;
        }
        await (0, scanner_1.scanDocument)(target, config, diagnostics, sidebar);
    }
    // ── Commands ─────────────────────────────────────────────────────────────────
    // Scan current file
    context.subscriptions.push(vscode.commands.registerCommand('regguard.scan', () => runScan()));
    // Scan workspace (all open text documents)
    context.subscriptions.push(vscode.commands.registerCommand('regguard.scanWorkspace', async () => {
        const docs = vscode.workspace.textDocuments.filter(d => d.uri.scheme === 'file' && !d.isUntitled);
        if (docs.length === 0) {
            vscode.window.showWarningMessage('RegGuard: No files open in workspace.');
            return;
        }
        for (const doc of docs) {
            await runScan(doc);
        }
    }));
    // Clear all flags
    context.subscriptions.push(vscode.commands.registerCommand('regguard.clearFlags', () => {
        diagnostics.clearAll();
        sidebar.updateFindings([]);
    }));
    // Open settings
    context.subscriptions.push(vscode.commands.registerCommand('regguard.configure', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'regguard');
    }));
    // Invalidate regulations cache and re-scan
    context.subscriptions.push(vscode.commands.registerCommand('regguard.refreshRegs', async () => {
        (0, scanner_1.invalidateCache)();
        await runScan();
    }));
    // Apply fix — called from code action provider (receives uri + finding object)
    context.subscriptions.push(vscode.commands.registerCommand('regguard.applyFix', async (uri, finding) => {
        await applyFix(uri, finding, diagnostics);
    }));
    // Apply fix by ID — called from sidebar (receives uri string + finding id string)
    context.subscriptions.push(vscode.commands.registerCommand('regguard.applyFixById', async (uriStr, findingId) => {
        const uri = vscode.Uri.parse(uriStr);
        const finding = diagnostics.getFindings(uriStr).find(f => f.id === findingId);
        if (!finding) {
            return;
        }
        await applyFix(uri, finding, diagnostics);
    }));
    // Show regulation detail panel — called from code action provider
    context.subscriptions.push(vscode.commands.registerCommand('regguard.showFindingDetails', (finding) => {
        const panel = vscode.window.createWebviewPanel('regguardDetail', `RegGuard: ${finding.regulation.name}`, vscode.ViewColumn.Beside, { enableScripts: false });
        panel.webview.html = buildDetailHtml(finding);
    }));
    // Dismiss a single finding
    context.subscriptions.push(vscode.commands.registerCommand('regguard.dismissFinding', (uri, _diag, finding) => {
        const remaining = diagnostics.getFindings(uri.toString()).filter(f => f.id !== finding.id);
        const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
        if (doc) {
            diagnostics.setFindings(doc, remaining);
        }
    }));
    // ── On-save trigger ───────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
        const cfg = (0, config_1.getConfig)();
        if (!cfg.scanOnSave) {
            return;
        }
        if ((0, config_1.validateConfig)(cfg)) {
            return;
        }
        runScan(doc);
    }));
    // Invalidate reg cache when settings change (product/region config changed)
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('regguard')) {
            (0, scanner_1.invalidateCache)();
        }
    }));
}
function deactivate() { }
// ── Helpers ───────────────────────────────────────────────────────────────────
async function applyFix(uri, finding, diagnostics) {
    if (!finding.proposedFix) {
        vscode.window.showInformationMessage('RegGuard: No fix available for this finding.');
        return;
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);
    const startLine = Math.min(finding.line, doc.lineCount - 1);
    const endLine = Math.min(finding.endLine, doc.lineCount - 1);
    const range = new vscode.Range(startLine, 0, endLine, doc.lineAt(endLine).text.length);
    const choice = await vscode.window.showInformationMessage(`RegGuard fix: ${finding.fixDescription ?? finding.regulation.name}`, { modal: false }, 'Apply Fix', 'Cancel');
    if (choice !== 'Apply Fix') {
        return;
    }
    const ok = await editor.edit(b => b.replace(range, finding.proposedFix));
    if (ok) {
        // Remove the resolved finding
        const remaining = diagnostics.getFindings(uri.toString()).filter(f => f.id !== finding.id);
        diagnostics.setFindings(doc, remaining);
        vscode.window.showInformationMessage(`RegGuard ✓ Fix applied for ${finding.regulation.name}`);
    }
}
function buildDetailHtml(f) {
    const trend = f.regulation.trending
        ? `<section class="trend"><h3>Trending</h3><p>${esc(f.regulation.trendReason ?? '')}</p></section>` : '';
    const src = f.regulation.source
        ? `<section><h3>Source</h3><a href="${esc(f.regulation.source)}">${esc(f.regulation.source)}</a></section>` : '';
    const fix = f.proposedFix
        ? `<section><h3>Proposed fix</h3><p>${esc(f.fixDescription ?? '')}</p><pre>${esc(f.proposedFix)}</pre></section>` : '';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:var(--vscode-font-family);padding:24px;color:var(--vscode-foreground);max-width:820px;line-height:1.6}
h1{font-size:17px;margin-bottom:4px}
.region{display:inline-block;padding:2px 8px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);border-radius:3px;font-size:11px;margin-bottom:18px}
section{margin-bottom:20px}
h3{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--vscode-descriptionForeground);margin-bottom:6px}
p{font-size:13px}
pre{background:var(--vscode-textBlockQuote-background);padding:12px;border-radius:4px;overflow-x:auto;font-family:var(--vscode-editor-font-family);font-size:12px;white-space:pre-wrap}
a{color:var(--vscode-textLink-foreground)}
.issue{border-left:3px solid var(--vscode-errorForeground,#f48771);padding-left:12px}
.trend{border-left:3px solid var(--vscode-editorWarning-foreground,#cca700);padding-left:12px}
</style></head><body>
<h1>${esc(f.regulation.name)}</h1>
<span class="region">${esc(f.regulation.region)}</span>
<section><h3>Regulation</h3><p>${esc(f.regulation.description)}</p></section>
<section class="issue"><h3>Issue on line ${f.line + 1}</h3><p>${esc(f.message)}</p></section>
${trend}${fix}${src}
</body></html>`;
}
function esc(s) {
    return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
//# sourceMappingURL=extension.js.map