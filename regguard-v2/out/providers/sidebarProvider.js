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

// src/providers/sidebarProvider.ts
var sidebarProvider_exports = {};
__export(sidebarProvider_exports, {
  SidebarProvider: () => SidebarProvider
});
module.exports = __toCommonJS(sidebarProvider_exports);
var vscode = __toESM(require("vscode"));
var SidebarProvider = class {
  constructor() {
    this.allFindings = [];
    this.isScanning = false;
    this.statusMsg = "";
  }
  static {
    this.viewType = "regguard.sidebar";
  }
  resolveWebviewView(webviewView, _ctx, _token) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.buildHtml();
    webviewView.webview.onDidReceiveMessage((msg) => {
      switch (msg.command) {
        case "scan":
          vscode.commands.executeCommand("regguard.scan");
          break;
        case "clearAll":
          vscode.commands.executeCommand("regguard.clearFlags");
          break;
        case "openSettings":
          vscode.commands.executeCommand("workbench.action.openSettings", "regguard");
          break;
        case "refreshRegs":
          vscode.commands.executeCommand("regguard.refreshRegs");
          break;
        case "jumpToLine":
          this.jumpToLine(msg.uri, msg.line);
          break;
        case "applyFix":
          vscode.commands.executeCommand("regguard.applyFixById", msg.uri, msg.findingId);
          break;
      }
    });
  }
  setScanning(scanning, msg = "") {
    this.isScanning = scanning;
    this.statusMsg = msg;
    this.refresh();
  }
  updateFindings(findings) {
    this.allFindings = findings;
    this.isScanning = false;
    this.lastScan = /* @__PURE__ */ new Date();
    this.statusMsg = "";
    this.refresh();
  }
  refresh() {
    if (this.view) {
      this.view.webview.html = this.buildHtml();
    }
  }
  async jumpToLine(uriStr, line) {
    try {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(uriStr));
      const editor = await vscode.window.showTextDocument(doc);
      const pos = new vscode.Position(line, 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    } catch {
    }
  }
  buildHtml() {
    const flat = this.allFindings.flatMap((f) => f.findings);
    const errors = flat.filter((f) => f.severity === "error").length;
    const warnings = flat.filter((f) => f.severity === "warning").length;
    const trending = flat.filter((f) => f.regulation.trending).length;
    const total = flat.length;
    const scanTime = this.lastScan ? this.lastScan.toLocaleTimeString() : "never";
    const statsHtml = !this.isScanning ? `
      <div class="stats">
        ${errors ? `<span class="badge err">\u2715 ${errors} Error${errors !== 1 ? "s" : ""}</span>` : ""}
        ${warnings ? `<span class="badge warn">! ${warnings} Warning${warnings !== 1 ? "s" : ""}</span>` : ""}
        ${trending ? `<span class="badge trend">\u2191 ${trending} Trending</span>` : ""}
        ${total === 0 ? `<span class="badge ok">\u2713 Clean</span>` : ""}
      </div>
      <div class="sub">Last scan: ${scanTime}</div>` : "";
    const findingsHtml = this.allFindings.map((file) => {
      const items = file.findings.map((f) => {
        const sc = f.severity === "error" ? "err" : f.severity === "warning" ? "warn" : "info";
        const tBadge = f.regulation.trending ? `<span class="badge trend">Trending</span>` : "";
        const rBadge = `<span class="badge region">${esc(f.regulation.region)}</span>`;
        const fixBtn = f.proposedFix ? `<button class="fix-btn" onclick="applyFix('${esc(file.uri)}','${esc(f.id)}')">Apply fix</button>` : "";
        return `
<div class="finding ${sc}">
  <div class="fhead">
    <span class="dot ${sc}"></span>
    <span class="rname">${esc(f.regulation.name)}</span>
    ${tBadge}${rBadge}
  </div>
  <div class="fmsg">${esc(f.message)}</div>
  <div class="fline">Line ${f.line + 1}${f.proposedFix ? " \xB7 fix available" : ""}</div>
  <div class="fbtns">
    <button class="go-btn" onclick="jump('${esc(file.uri)}',${f.line})">Go to line</button>
    ${fixBtn}
  </div>
</div>`;
      }).join("");
      return `<div class="file-group"><div class="fname">\u{1F4C4} ${esc(file.fileName)}</div>${items}</div>`;
    }).join("");
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--vscode-font-family);font-size:12px;color:var(--vscode-foreground);background:var(--vscode-sideBar-background);padding:8px}
.toolbar{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}
button{padding:3px 9px;border:none;border-radius:3px;cursor:pointer;font-size:11px;background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
button:hover{background:var(--vscode-button-hoverBackground)}
.sec{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
.sec:hover{background:var(--vscode-button-secondaryHoverBackground)}
.stats{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px}
.badge{padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600}
.badge.err{background:var(--vscode-inputValidation-errorBackground,#5a1d1d);color:var(--vscode-errorForeground,#f48771)}
.badge.warn{background:var(--vscode-inputValidation-warningBackground,#352a05);color:var(--vscode-editorWarning-foreground,#cca700)}
.badge.trend{background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
.badge.ok{background:var(--vscode-testing-iconPassed,#388a34);color:#fff}
.badge.region{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);font-size:9px}
.sub{font-size:10px;color:var(--vscode-descriptionForeground);margin-bottom:8px}
.scanning{padding:24px 8px;text-align:center;color:var(--vscode-descriptionForeground);font-style:italic}
.empty{padding:24px 8px;text-align:center;color:var(--vscode-descriptionForeground);line-height:1.8}
.file-group{margin-bottom:12px}
.fname{font-size:11px;font-weight:600;color:var(--vscode-descriptionForeground);padding:3px 0;border-bottom:1px solid var(--vscode-widget-border,#424242);margin-bottom:5px;word-break:break-all}
.finding{padding:7px 8px;border-radius:3px;margin-bottom:5px;border-left:3px solid;background:var(--vscode-input-background)}
.finding.err{border-color:var(--vscode-errorForeground,#f48771)}
.finding.warn{border-color:var(--vscode-editorWarning-foreground,#cca700)}
.finding.info{border-color:var(--vscode-editorInfo-foreground,#75beff)}
.fhead{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:4px}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dot.err{background:var(--vscode-errorForeground,#f48771)}
.dot.warn{background:var(--vscode-editorWarning-foreground,#cca700)}
.dot.info{background:var(--vscode-editorInfo-foreground,#75beff)}
.rname{font-weight:600;font-size:11px;flex:1;min-width:0;word-break:break-word}
.fmsg{font-size:11px;line-height:1.5;margin-bottom:3px;color:var(--vscode-foreground)}
.fline{font-size:10px;color:var(--vscode-descriptionForeground);margin-bottom:5px}
.fbtns{display:flex;gap:4px}
.go-btn{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);font-size:10px;padding:2px 7px}
.fix-btn{background:var(--vscode-button-background);color:var(--vscode-button-foreground);font-size:10px;font-weight:700;padding:2px 7px}
</style></head><body>
<div class="toolbar">
  <button onclick="scan()">\u27F3 Scan</button>
  <button class="sec" onclick="clearAll()">\u2715 Clear</button>
  <button class="sec" onclick="refreshRegs()">\u21BA Regs</button>
  <button class="sec" onclick="openSettings()">\u2699</button>
</div>
${this.isScanning ? `<div class="scanning">\u{1F50D} ${this.statusMsg || "Scanning\u2026"}</div>` : statsHtml}
${!this.isScanning && this.allFindings.length === 0 ? `<div class="empty">No findings yet.<br>Click <b>Scan</b> or save a file.<br><br>Configure your product &amp; regions<br>in Settings (\u2699).</div>` : findingsHtml}
<script>
const vscode=acquireVsCodeApi();
function scan(){vscode.postMessage({command:'scan'})}
function clearAll(){vscode.postMessage({command:'clearAll'})}
function openSettings(){vscode.postMessage({command:'openSettings'})}
function refreshRegs(){vscode.postMessage({command:'refreshRegs'})}
function jump(uri,line){vscode.postMessage({command:'jumpToLine',uri,line})}
function applyFix(uri,findingId){vscode.postMessage({command:'applyFix',uri,findingId})}
</script>
</body></html>`;
  }
};
function esc(s) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SidebarProvider
});
//# sourceMappingURL=sidebarProvider.js.map
