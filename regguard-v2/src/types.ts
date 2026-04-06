export interface RegGuardConfig {
  openRouterKey: string;
  productType: string;
  releaseRegions: string[];
  clientRegions: string[];
  externalTools: string[];
  internalTools: string[];
  scanOnSave: boolean;
}

export interface Regulation {
  id: string;
  name: string;
  description: string;
  region: string;
  source?: string;
  trending?: boolean;
  trendReason?: string;
}

export interface CodeFinding {
  id: string;
  line: number;       // 0-indexed inside extension; Claude returns 1-indexed and we convert
  endLine: number;    // 0-indexed
  startChar: number;
  endChar: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  regulation: Regulation;
  proposedFix?: string;
  fixDescription?: string;
  originalCode?: string;
}
