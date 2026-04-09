import * as vscode from 'vscode';
import { RegGuardConfig } from './types';
import { trackEvent } from './telemetry';

export function getConfig(): RegGuardConfig {
  const cfg = vscode.workspace.getConfiguration('regguard');
  return {
    openRouterKey: cfg.get<string>('openRouterKey', ''),
    productType:   cfg.get<string>('productType', ''),
    releaseRegions: cfg.get<string[]>('releaseRegions', []),
    clientRegions:  cfg.get<string[]>('clientRegions', []),
    externalTools: cfg.get<string[]>('externalTools', []),
    internalTools: cfg.get<string[]>('internalTools', []),
    scanOnSave:    cfg.get<boolean>('scanOnSave', false),
  };
}

export function validateConfig(config: RegGuardConfig): string | null {
  if (!config.openRouterKey.trim()) {
    trackEvent('api_key_missing');
    return 'RegGuard: OpenRouter API key is missing. Add it in Settings → RegGuard.';
  }
  if (!config.productType.trim()) {
    trackEvent('product_type_missing');
    return 'RegGuard: Product type is missing. Describe your product in Settings → RegGuard.';
  }
  return null;
}
