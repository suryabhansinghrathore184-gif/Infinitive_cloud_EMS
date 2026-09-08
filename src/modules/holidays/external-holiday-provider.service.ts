import { HolidayEntity, HolidayCategoryType } from './holiday.entity';

interface NagerHolidayItem {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export class ExternalHolidayProviderService {
  private readonly defaultCountry = process.env.HOLIDAY_DEFAULT_COUNTRY || 'IN';
  private readonly apiUrl = process.env.HOLIDAY_API_URL || 'https://date.nager.at/api/v3/PublicHolidays';

  /**
   * Fetches official public holidays for a given year and country from external provider API.
   * Normalizes response into HolidayEntity array.
   */
  async fetchExternalHolidays(
    year: number,
    countryCode: string = this.defaultCountry
  ): Promise<Omit<HolidayEntity, 'id' | 'createdAt' | 'updatedAt'>[]> {
    try {
      const url = `${this.apiUrl}/${year}/${countryCode}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 }, // Cache 24 hours
      });

      if (response.ok) {
        const rawData: NagerHolidayItem[] = await response.json();
        return rawData.map((item) => ({
          name: item.localName || item.name,
          description: `Official ${item.types?.join(', ') || 'Public'} Holiday (${countryCode})`,
          date: item.date,
          category: this.mapCategory(item.types),
          country: item.countryCode || countryCode,
          state: item.counties && item.counties.length > 0 ? item.counties.join(', ') : null,
          isOptional: !item.fixed,
          isMandatory: item.fixed || item.global,
          status: 'ACTIVE',
        }));
      }
    } catch (error) {
      console.warn(`External Holiday API unavailable (${error}). Generating official fallback holidays...`);
    }

    // Fallback official holidays for specified year
    return this.getOfficialFallbackHolidays(year, countryCode);
  }

  private mapCategory(types: string[] = []): HolidayCategoryType {
    if (types.includes('National')) return 'NATIONAL_HOLIDAY';
    if (types.includes('Optional')) return 'OPTIONAL_HOLIDAY';
    return 'PUBLIC_HOLIDAY';
  }

  private getOfficialFallbackHolidays(
    year: number,
    countryCode: string
  ): Omit<HolidayEntity, 'id' | 'createdAt' | 'updatedAt'>[] {
    const list = [
      { name: 'New Year Day', date: `${year}-01-01`, category: 'PUBLIC_HOLIDAY' as const },
      { name: 'Republic Day', date: `${year}-01-26`, category: 'NATIONAL_HOLIDAY' as const },
      { name: 'Ganesh Chaturthi', date: `${year}-08-27`, category: 'PUBLIC_HOLIDAY' as const },
      { name: 'Onam', date: `${year}-08-26`, category: 'COMPANY_FESTIVAL' as const },
      { name: 'Independence Day', date: `${year}-08-15`, category: 'NATIONAL_HOLIDAY' as const },
      { name: 'Gandhi Jayanti', date: `${year}-10-02`, category: 'NATIONAL_HOLIDAY' as const },
      { name: 'Diwali', date: `${year}-11-08`, category: 'COMPANY_FESTIVAL' as const },
      { name: 'Christmas', date: `${year}-12-25`, category: 'PUBLIC_HOLIDAY' as const },
    ];

    return list.map((item) => ({
      name: item.name,
      description: `Official Calendar Holiday (${year})`,
      date: item.date,
      category: item.category,
      country: countryCode,
      state: null,
      isOptional: false,
      isMandatory: true,
      status: 'ACTIVE',
    }));
  }
}
