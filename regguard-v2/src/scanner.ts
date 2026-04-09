import * as vscode from 'vscode';
import { RegGuardConfig, Regulation } from './types';
import { findRegulations }         from './agents/perplexityAgent';
import { findTrendingRegulations } from './agents/grokAgent';
import { analyzeCode }             from './agents/claudeAgent';
import { DiagnosticsProvider }     from './providers/diagnosticsProvider';
import { SidebarProvider }         from './providers/sidebarProvider';
import { trackEvent }              from './telemetry';

// ── Regulation cache (30 min TTL — regs don't change every scan) ─────────────
let regCache:      Regulation[] | null = null;
let trendingCache: Regulation[] | null = null;
let cacheTs:       number | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export function invalidateCache(): void {
  regCache = trendingCache = cacheTs = null;
}

// ── Main scan entry point ─────────────────────────────────────────────────────
export async function scanDocument(
  document:            vscode.TextDocument,
  config:              RegGuardConfig,
  diagnosticsProvider: DiagnosticsProvider,
  sidebarProvider:     SidebarProvider
): Promise<void> {
  const startTime = Date.now();
  trackEvent('compliance_scan_triggered', { codeLength: document.getText().length });

  sidebarProvider.setScanning(true, 'Fetching regulations…');

  try {
    // 1. Fetch / use cached regulations
    const now = Date.now();
    if (!cacheTs || now - cacheTs > CACHE_TTL || !regCache || !trendingCache) {
      trackEvent('perplexity_search_started', { searchType: 'global_regulations' });
      trackEvent('grok_search_started', { searchType: 'trending_regulations' });
      
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'RegGuard', cancellable: false },
        async (p) => {
          p.report({ message: 'Fetching current regulations (Perplexity)…' });
          regCache = await findRegulations(config);
          trackEvent('perplexity_search_success', { regulationsCount: regCache?.length ?? 0 });

          p.report({ message: 'Fetching trending regulations (Grok)…' });
          trendingCache = await findTrendingRegulations(config);
          trackEvent('grok_search_success', { trendingCount: trendingCache?.length ?? 0 });

          cacheTs = Date.now();
        }
      );
    } else {
      trackEvent('regulations_cache_hit');
    }

    const regulations  = regCache      ?? [];
    const trendingRegs = trendingCache ?? [];

    // 2. Analyse the document with Claude
    sidebarProvider.setScanning(true, 'Analysing code (Claude)…');
    const shortName = document.fileName.split(/[\\/]/).pop() ?? document.fileName;

    trackEvent('claude_analysis_started');

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'RegGuard', cancellable: false },
      async (p) => {
        p.report({ message: `Analysing ${shortName}…` });

        const findings = await analyzeCode(
          document.getText(),
          document.fileName,
          document.languageId,
          regulations,
          trendingRegs,
          config.openRouterKey
        );

        trackEvent('claude_analysis_success', { findingsCount: findings.length });

        const duration = Date.now() - startTime;
        trackEvent('full_scan_success', { duration, issuesFound: findings.length });

        trackEvent('compliance_scan_completed', {
          issuesFound: findings.length,
          hasGDPR: findings.some(f => f.regulation?.name?.includes('GDPR')),
          hasCCPA: findings.some(f => f.regulation?.name?.includes('CCPA')),
          hasHIPAA: findings.some(f => f.regulation?.name?.includes('HIPAA')),
          hasPDPA: findings.some(f => f.regulation?.name?.includes('PDPA')),
          hasEUAI: findings.some(f => f.regulation?.name?.includes('EU AI'))
        });

        diagnosticsProvider.setFindings(document, findings);

        // Push all findings across all open files to the sidebar
        const allFindings = Array.from(diagnosticsProvider.getAllFindings().entries()).map(
          ([uri, flist]) => ({
            uri,
            fileName: uri.split(/[\\/]/).pop() ?? uri,
            findings: flist
          })
        );
        sidebarProvider.updateFindings(allFindings);

        const n = findings.length;
        if (n === 0) {
          vscode.window.showInformationMessage(`RegGuard ✓ No compliance issues in ${shortName}`);
        } else {
          vscode.window.showWarningMessage(
            `RegGuard: ${n} issue${n !== 1 ? 's' : ''} in ${shortName}. See Problems panel or sidebar.`
          );
        }
      }
    );

  } catch (err: any) {
    sidebarProvider.setScanning(false);
    trackEvent('full_scan_failed', { error: err?.message ?? 'unknown' });
    vscode.window.showErrorMessage(`RegGuard error: ${err?.message ?? err}`);
    throw err;
  }
}
