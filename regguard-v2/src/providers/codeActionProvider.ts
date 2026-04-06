import * as vscode from 'vscode';
import { CodeFinding } from '../types';
import { DiagnosticsProvider } from './diagnosticsProvider';

export class CodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Empty
  ];

  constructor(private diagnosticsProvider: DiagnosticsProvider) {}

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== 'RegGuard') { continue; }

      const finding: CodeFinding | undefined = (diag as any).__regguardFinding;
      if (!finding) { continue; }

      if (finding.proposedFix) {
        const fix = new vscode.CodeAction(
          `RegGuard: Apply fix — ${finding.fixDescription ?? finding.regulation.name}`,
          vscode.CodeActionKind.QuickFix
        );
        fix.diagnostics = [diag];
        fix.isPreferred = true;
        fix.command = {
          command: 'regguard.applyFix',
          title: 'Apply RegGuard compliance fix',
          arguments: [document.uri, finding]
        };
        actions.push(fix);
      }

      const details = new vscode.CodeAction(
        `RegGuard: View — ${finding.regulation.name} (${finding.regulation.region})`,
        vscode.CodeActionKind.Empty
      );
      details.command = {
        command: 'regguard.showFindingDetails',
        title: 'View regulation details',
        arguments: [finding]
      };
      actions.push(details);

      const dismiss = new vscode.CodeAction(
        'RegGuard: Dismiss this flag',
        vscode.CodeActionKind.Empty
      );
      dismiss.command = {
        command: 'regguard.dismissFinding',
        title: 'Dismiss',
        arguments: [document.uri, diag, finding]
      };
      actions.push(dismiss);
    }

    return actions;
  }
}
