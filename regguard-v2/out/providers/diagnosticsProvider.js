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
exports.DiagnosticsProvider = void 0;
const vscode = __importStar(require("vscode"));
class DiagnosticsProvider {
    constructor() {
        this.findingsMap = new Map();
        this.collection = vscode.languages.createDiagnosticCollection('regguard');
    }
    setFindings(document, findings) {
        const key = document.uri.toString();
        this.findingsMap.set(key, findings);
        const diagnostics = findings.map(f => {
            const startLine = Math.min(f.line, document.lineCount - 1);
            const endLine = Math.min(f.endLine, document.lineCount - 1);
            const startLineText = document.lineAt(startLine).text;
            const endLineText = document.lineAt(endLine).text;
            const startChar = Math.min(f.startChar ?? 0, startLineText.length);
            const endChar = Math.min(f.endChar ?? endLineText.length, endLineText.length);
            const range = new vscode.Range(startLine, startChar, endLine, endChar);
            const msg = `[RegGuard] ${f.message}` +
                (f.regulation.trending ? ` ⚠ Trending: ${f.regulation.name}` : ` — ${f.regulation.name}`);
            const d = new vscode.Diagnostic(range, msg, this.mapSeverity(f.severity));
            d.source = 'RegGuard';
            d.code = { value: f.regulation.id, target: vscode.Uri.parse(f.regulation.source || 'https://openrouter.ai') };
            // Attach finding for code action provider — stored on the object, not serialised
            d.__regguardFinding = f;
            return d;
        });
        this.collection.set(document.uri, diagnostics);
    }
    getFindings(uriKey) {
        return this.findingsMap.get(uriKey) ?? [];
    }
    getAllFindings() {
        return this.findingsMap;
    }
    clearAll() {
        this.collection.clear();
        this.findingsMap.clear();
    }
    clearDocument(uri) {
        this.collection.delete(uri);
        this.findingsMap.delete(uri.toString());
    }
    dispose() {
        this.collection.dispose();
    }
    mapSeverity(s) {
        if (s === 'error')
            return vscode.DiagnosticSeverity.Error;
        if (s === 'warning')
            return vscode.DiagnosticSeverity.Warning;
        return vscode.DiagnosticSeverity.Information;
    }
}
exports.DiagnosticsProvider = DiagnosticsProvider;
//# sourceMappingURL=diagnosticsProvider.js.map