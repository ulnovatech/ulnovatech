import { getCsvImportFileInfo, loadCsvCandidates } from '../lib/csv-import-service';
import { platformSettings } from '@agency/settings';
import type { DiscoveredBusiness, DiscoveryProvider, DiscoverySearchParams } from './types';

export class CsvImportProvider implements DiscoveryProvider {
  readonly name = 'csv_import' as const;
  readonly label = 'CSV import (your own lead file)';

  async isConfigured(): Promise<boolean> {
    await platformSettings.ensureLoaded();
    return getCsvImportFileInfo().configured;
  }

  async discover(params: DiscoverySearchParams): Promise<DiscoveredBusiness[]> {
    await platformSettings.ensureLoaded();
    return loadCsvCandidates(params);
  }
}
