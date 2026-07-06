import { acquisitionSettings, getDb } from '@agency/database';
import { eq } from 'drizzle-orm';
import { SETTINGS_KEYS } from './types';

export class SettingsRepository {
  async getJson<T>(key: string): Promise<T | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(acquisitionSettings)
      .where(eq(acquisitionSettings.key, key));
    return (row?.value as T) ?? null;
  }

  async setJson(key: string, value: Record<string, unknown>) {
    const db = getDb();
    const existing = await this.getJson(key);
    if (existing !== null) {
      await db
        .update(acquisitionSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(acquisitionSettings.key, key));
    } else {
      await db.insert(acquisitionSettings).values({ key, value });
    }
  }

  async getAllPlatformKeys() {
    const db = getDb();
    return db
      .select()
      .from(acquisitionSettings)
      .where(eq(acquisitionSettings.key, SETTINGS_KEYS.acquisition));
  }
}
