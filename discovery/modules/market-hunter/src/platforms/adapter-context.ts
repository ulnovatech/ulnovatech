import type { MarketHunterSpendGuard } from '../budget.guard';

export type AdapterScanContext = {
  spendGuard?: MarketHunterSpendGuard;
  scanId?: string;
};

let adapterScanContext: AdapterScanContext = {};

export function setAdapterScanContext(ctx: AdapterScanContext): void {
  adapterScanContext = ctx;
}

export function getAdapterScanContext(): AdapterScanContext {
  return adapterScanContext;
}
