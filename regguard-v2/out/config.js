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

// src/config.ts
var config_exports = {};
__export(config_exports, {
  getConfig: () => getConfig,
  validateConfig: () => validateConfig
});
module.exports = __toCommonJS(config_exports);
var vscode = __toESM(require("vscode"));
function getConfig() {
  const cfg = vscode.workspace.getConfiguration("regguard");
  return {
    openRouterKey: cfg.get("openRouterKey", ""),
    productType: cfg.get("productType", ""),
    releaseRegions: cfg.get("releaseRegions", []),
    clientRegions: cfg.get("clientRegions", []),
    externalTools: cfg.get("externalTools", []),
    internalTools: cfg.get("internalTools", []),
    scanOnSave: cfg.get("scanOnSave", false)
  };
}
function validateConfig(config) {
  if (!config.openRouterKey.trim()) {
    return "RegGuard: OpenRouter API key is missing. Add it in Settings \u2192 RegGuard.";
  }
  if (!config.productType.trim()) {
    return "RegGuard: Product type is missing. Describe your product in Settings \u2192 RegGuard.";
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getConfig,
  validateConfig
});
//# sourceMappingURL=config.js.map
