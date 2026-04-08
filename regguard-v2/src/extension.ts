import * as vscode from 'vscode';
import { getConfig, validateConfig } from './config';
import { DiagnosticsProvider } from './providers/diagnosticsProvider';
import { CodeActionProvider } from './providers/codeActionProvider';
import { SidebarProvider } from './providers/sidebarProvider';
import { scanDocument, invalidateCache } from './scanner';
import { CodeFinding } from './types';

export function activate(context: vscode.ExtensionContext): void {

  // ── Providers ────────────────────────────────────────────────────────────────
  const diagnostics = new DiagnosticsProvider();
  const sidebar = new SidebarProvider();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar),
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file' },
      new CodeActionProvider(diagnostics),
      { providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds }
    ),
    diagnostics
  );

  // ── Helper: run a scan after validating config ────────────────────────────────
  async function runScan(doc?: vscode.TextDocument): Promise<void> {
    const target = doc ?? vscode.window.activeTextEditor?.document;
    if (!target) {
      vscode.window.showWarningMessage('RegGuard: Open a file first.');
      return;
    }
    const config = getConfig();
    const err = validateConfig(config);
    if (err) {
      const choice = await vscode.window.showErrorMessage(err, 'Open Settings');
      if (choice === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'regguard');
      }
      return;
    }
    await scanDocument(target, config, diagnostics, sidebar);
  }

  // ── Commands ─────────────────────────────────────────────────────────────────

  // Scan current file
  context.subscriptions.push(
    vscode.commands.registerCommand('regguard.scan', () => runScan())
  );

  // Scan workspace (all open text documents)
  context.subscriptions.push(
    vscode.commands.registerCommand('regguard.scanWorkspace', async () => {
      const docs = vscode.workspace.textDocuments.filter(
        d => d.uri.scheme === 'file' && !d.isUntitled
      );
      if (docs.length === 0) {
        vscode.window.showWarningMessage('RegGuard: No files open in workspace.');
        return;
      }
      for (const doc of docs) {
        await runScan(doc);
      }
    })
  );

  // Clear all flags
  context.subscriptions.push(
    vscode.commands.registerCommand('regguard.clearFlags', () => {
      diagnostics.clearAll();
      sidebar.updateFindings([]);
    })
  );

  // Open settings
  context.subscriptions.push(
    vscode.commands.registerCommand('regguard.configure', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'regguard');
    })
  );

  // Invalidate regulations cache and re-scan
  context.subscriptions.push(
    vscode.commands.registerCommand('regguard.refreshRegs', async () => {
      invalidateCache();
      await runScan();
    })
  );

  // Apply fix — called from code action provider (receives uri + finding object)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'regguard.applyFix',
      async (uri: vscode.Uri, finding: CodeFinding) => {
        await applyFix(uri, finding, diagnostics);
      }
    )
  );

  // Apply fix by ID — called from sidebar (receives uri string + finding id string)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'regguard.applyFixById',
      async (uriStr: string, findingId: string) => {
        const uri = vscode.Uri.parse(uriStr);
        const finding = diagnostics.getFindings(uriStr).find(f => f.id === findingId);
        if (!finding) { return; }
        await applyFix(uri, finding, diagnostics);
      }
    )
  );

  // Show regulation detail panel — called from code action provider
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'regguard.showFindingDetails',
      (finding: CodeFinding) => {
        const panel = vscode.window.createWebviewPanel(
          'regguardDetail',
          `RegGuard: ${finding.regulation.name}`,
          vscode.ViewColumn.Beside,
          { enableScripts: false }
        );
        panel.webview.html = buildDetailHtml(finding);
      }
    )
  );

  // Dismiss a single finding
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'regguard.dismissFinding',
      (uri: vscode.Uri, _diag: vscode.Diagnostic, finding: CodeFinding) => {
        const remaining = diagnostics.getFindings(uri.toString()).filter(f => f.id !== finding.id);
        const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
        if (doc) { diagnostics.setFindings(doc, remaining); }
      }
    )
  );

  // ── On-save trigger ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      const cfg = getConfig();
      if (!cfg.scanOnSave) { return; }
      if (validateConfig(cfg)) { return; }
      runScan(doc);
    })
  );

  // Invalidate reg cache when settings change (product/region config changed)
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('regguard')) {
        invalidateCache();
      }
    })
  );
}

export function deactivate(): void {/* nothing to clean up */ }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function applyFix(
  uri: vscode.Uri,
  finding: CodeFinding,
  diagnostics: DiagnosticsProvider
): Promise<void> {
  if (!finding.proposedFix) {
    vscode.window.showInformationMessage('RegGuard: No fix available for this finding.');
    return;
  }

  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);

  if (doc.lineCount === 0 || finding.line < 0) {
    vscode.window.showErrorMessage('RegGuard: Cannot apply fix to an empty document.');
    return;
  }

  const startLine = Math.max(0, Math.min(finding.line, doc.lineCount - 1));
  const endLine = Math.max(0, Math.min(finding.endLine ?? finding.line, doc.lineCount - 1));

  const range = new vscode.Range(
    startLine, 0,
    endLine, doc.lineAt(endLine).range.end.character
  );

  const choice = await vscode.window.showInformationMessage(
    `RegGuard fix: ${finding.fixDescription ?? finding.regulation.name}`,
    { modal: false },
    'Apply Fix',
    'Cancel'
  );

  if (choice !== 'Apply Fix') { return; }

  const ok = await editor.edit(editBuilder => editBuilder.replace(range, finding.proposedFix!));
  if (ok) {
    // Remove the resolved finding
    const remaining = diagnostics.getFindings(uri.toString()).filter(f => f.id !== finding.id);
    diagnostics.setFindings(doc, remaining);
    vscode.window.showInformationMessage(`RegGuard ✓ Fix applied for ${finding.regulation.name}`);
  }
}

function buildDetailHtml(f: CodeFinding): string {
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

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
