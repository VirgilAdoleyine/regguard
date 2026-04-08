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

// src/providers/codeActionProvider.ts
var codeActionProvider_exports = {};
__export(codeActionProvider_exports, {
  CodeActionProvider: () => CodeActionProvider
});
module.exports = __toCommonJS(codeActionProvider_exports);
var vscode = __toESM(require("vscode"));
var CodeActionProvider = class {
  constructor(diagnosticsProvider) {
    this.diagnosticsProvider = diagnosticsProvider;
  }
  static {
    this.providedCodeActionKinds = [
      vscode.CodeActionKind.QuickFix,
      vscode.CodeActionKind.Empty
    ];
  }
  provideCodeActions(document, _range, context) {
    const actions = [];
    for (const diag of context.diagnostics) {
      if (diag.source !== "RegGuard") {
        continue;
      }
      const finding = diag.__regguardFinding;
      if (!finding) {
        continue;
      }
      if (finding.proposedFix) {
        const fix = new vscode.CodeAction(
          `RegGuard: Apply fix \u2014 ${finding.fixDescription ?? finding.regulation.name}`,
          vscode.CodeActionKind.QuickFix
        );
        fix.diagnostics = [diag];
        fix.isPreferred = true;
        fix.command = {
          command: "regguard.applyFix",
          title: "Apply RegGuard compliance fix",
          arguments: [document.uri, finding]
        };
        actions.push(fix);
      }
      const details = new vscode.CodeAction(
        `RegGuard: View \u2014 ${finding.regulation.name} (${finding.regulation.region})`,
        vscode.CodeActionKind.Empty
      );
      details.command = {
        command: "regguard.showFindingDetails",
        title: "View regulation details",
        arguments: [finding]
      };
      actions.push(details);
      const dismiss = new vscode.CodeAction(
        "RegGuard: Dismiss this flag",
        vscode.CodeActionKind.Empty
      );
      dismiss.command = {
        command: "regguard.dismissFinding",
        title: "Dismiss",
        arguments: [document.uri, diag, finding]
      };
      actions.push(dismiss);
    }
    return actions;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CodeActionProvider
});
//# sourceMappingURL=codeActionProvider.js.map
