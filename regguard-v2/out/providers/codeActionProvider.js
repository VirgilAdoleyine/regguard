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
exports.CodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
class CodeActionProvider {
    constructor(diagnosticsProvider) {
        this.diagnosticsProvider = diagnosticsProvider;
    }
    provideCodeActions(document, _range, context) {
        const actions = [];
        for (const diag of context.diagnostics) {
            if (diag.source !== 'RegGuard') {
                continue;
            }
            const finding = diag.__regguardFinding;
            if (!finding) {
                continue;
            }
            if (finding.proposedFix) {
                const fix = new vscode.CodeAction(`RegGuard: Apply fix — ${finding.fixDescription ?? finding.regulation.name}`, vscode.CodeActionKind.QuickFix);
                fix.diagnostics = [diag];
                fix.isPreferred = true;
                fix.command = {
                    command: 'regguard.applyFix',
                    title: 'Apply RegGuard compliance fix',
                    arguments: [document.uri, finding]
                };
                actions.push(fix);
            }
            const details = new vscode.CodeAction(`RegGuard: View — ${finding.regulation.name} (${finding.regulation.region})`, vscode.CodeActionKind.Empty);
            details.command = {
                command: 'regguard.showFindingDetails',
                title: 'View regulation details',
                arguments: [finding]
            };
            actions.push(details);
            const dismiss = new vscode.CodeAction('RegGuard: Dismiss this flag', vscode.CodeActionKind.Empty);
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
exports.CodeActionProvider = CodeActionProvider;
CodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Empty
];
//# sourceMappingURL=codeActionProvider.js.map