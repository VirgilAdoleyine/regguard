"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/providers/diagnosticsProvider.ts
var diagnosticsProvider_exports = {};
__export(diagnosticsProvider_exports, {
  DiagnosticsProvider: () => DiagnosticsProvider
});
module.exports = __toCommonJS(diagnosticsProvider_exports);
var vscode = __toESM(require("vscode"));
var DiagnosticsProvider = class {
  constructor() {
    this.findingsMap = /* @__PURE__ */ new Map();
    this.collection = vscode.languages.createDiagnosticCollection("regguard");
  }
  setFindings(document, findings) {
    const key = document.uri.toString();
    this.findingsMap.set(key, findings);
    const diagnostics = findings.map((f) => {
      const startLine = Math.min(f.line, document.lineCount - 1);
      const endLine = Math.min(f.endLine, document.lineCount - 1);
      const startLineText = document.lineAt(startLine).text;
      const endLineText = document.lineAt(endLine).text;
      const startChar = Math.min(f.startChar ?? 0, startLineText.length);
      const endChar = Math.min(f.endChar ?? endLineText.length, endLineText.length);
      const range = new vscode.Range(startLine, startChar, endLine, endChar);
      const msg = `[RegGuard] ${f.message}` + (f.regulation.trending ? ` \u26A0 Trending: ${f.regulation.name}` : ` \u2014 ${f.regulation.name}`);
      const d = new vscode.Diagnostic(range, msg, this.mapSeverity(f.severity));
      d.source = "RegGuard";
      d.code = { value: f.regulation.id, target: vscode.Uri.parse(f.regulation.source || "https://openrouter.ai") };
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
    if (s === "error") return vscode.DiagnosticSeverity.Error;
    if (s === "warning") return vscode.DiagnosticSeverity.Warning;
    return vscode.DiagnosticSeverity.Information;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DiagnosticsProvider
});
//# sourceMappingURL=diagnosticsProvider.js.map
