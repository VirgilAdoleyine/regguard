import * as vscode from 'vscode';
import { CodeFinding } from '../types';

export class DiagnosticsProvider implements vscode.Disposable {
  private collection: vscode.DiagnosticCollection;
  private findingsMap = new Map<string, CodeFinding[]>();

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection('regguard');
  }

  setFindings(document: vscode.TextDocument, findings: CodeFinding[]): void {
    const key = document.uri.toString();
    this.findingsMap.set(key, findings);

    const diagnostics = findings.map(f => {
      const startLine = Math.min(f.line, document.lineCount - 1);
      const endLine   = Math.min(f.endLine, document.lineCount - 1);

      const startLineText = document.lineAt(startLine).text;
      const endLineText   = document.lineAt(endLine).text;

      const startChar = Math.min(f.startChar ?? 0, startLineText.length);
      const endChar   = Math.min(f.endChar ?? endLineText.length, endLineText.length);

      const range = new vscode.Range(startLine, startChar, endLine, endChar);

      const msg = `[RegGuard] ${f.message}` +
        (f.regulation.trending ? ` ⚠ Trending: ${f.regulation.name}` : ` — ${f.regulation.name}`);

      const d = new vscode.Diagnostic(range, msg, this.mapSeverity(f.severity));
      d.source = 'RegGuard';
      d.code   = { value: f.regulation.id, target: vscode.Uri.parse(f.regulation.source || 'https://openrouter.ai') };

      // Attach finding for code action provider — stored on the object, not serialised
      (d as any).__regguardFinding = f;

      return d;
    });

    this.collection.set(document.uri, diagnostics);
  }

  getFindings(uriKey: string): CodeFinding[] {
    return this.findingsMap.get(uriKey) ?? [];
  }

  getAllFindings(): Map<string, CodeFinding[]> {
    return this.findingsMap;
  }

  clearAll(): void {
    this.collection.clear();
    this.findingsMap.clear();
  }

  clearDocument(uri: vscode.Uri): void {
    this.collection.delete(uri);
    this.findingsMap.delete(uri.toString());
  }

  dispose(): void {
    this.collection.dispose();
  }

  private mapSeverity(s: string): vscode.DiagnosticSeverity {
    if (s === 'error')   return vscode.DiagnosticSeverity.Error;
    if (s === 'warning') return vscode.DiagnosticSeverity.Warning;
    return vscode.DiagnosticSeverity.Information;
  }
}
