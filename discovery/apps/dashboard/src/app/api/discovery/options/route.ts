import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await platformSettings.ensureLoaded();
    const { discovery } = settings;

    return NextResponse.json({
      countries: discovery.countries,
      industries: discovery.industries,
      citiesByCountry: discovery.citiesByCountry,
      allCitiesLabel: discovery.allCitiesLabel,
      defaults: discovery.defaults,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
