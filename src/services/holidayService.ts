import { ApiHolidayResponseItem, ApiResponsePayload } from '@/modules/holidays/holiday.entity';
import { CreateHolidayDto, UpdateHolidayDto, QueryHolidayFilterDto } from '@/modules/holidays/holiday.dto';

class HolidayServiceFrontend {
  private readonly baseUrl = '/api/v1/holidays';

  /**
   * Fetches normalized holiday list for a given year & filters from backend API / database.
   */
  async getHolidays(
    year?: number,
    filters: QueryHolidayFilterDto = {}
  ): Promise<ApiHolidayResponseItem[]> {
    try {
      const selectedYear = year || new Date().getFullYear();
      const queryParams = new URLSearchParams();

      if (filters.country) queryParams.append('country', filters.country);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.state) queryParams.append('state', filters.state);

      const url = `${this.baseUrl}/year/${selectedYear}?${queryParams.toString()}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const payload: ApiResponsePayload<ApiHolidayResponseItem[]> = await res.json();
        if (payload.success && Array.isArray(payload.data)) {
          return payload.data;
        }
      }
    } catch (error) {
      console.warn('Frontend Holiday API request failed, utilizing local fallback:', error);
    }

    // Direct fallback using backend HolidayController directly if fetch is unmounted/SSR
    const { HolidayController } = await import('@/modules/holidays/holiday.controller');
    const controller = new HolidayController();
    const result = await controller.getHolidaysByYear(year || new Date().getFullYear(), filters.country || 'IN');
    return result.data || [];
  }

  async getHolidayById(id: string): Promise<ApiHolidayResponseItem | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.ok) {
      const payload: ApiResponsePayload<ApiHolidayResponseItem> = await res.json();
      return payload.data;
    }
    return null;
  }

  async createHoliday(dto: CreateHolidayDto): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'HR_ADMIN',
      },
      body: JSON.stringify(dto),
    });

    return await res.json();
  }

  async updateHoliday(id: string, dto: UpdateHolidayDto): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'HR_ADMIN',
      },
      body: JSON.stringify(dto),
    });

    return await res.json();
  }

  async deleteHoliday(id: string): Promise<ApiResponsePayload<{ id: string }>> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': 'HR_ADMIN',
      },
    });

    return await res.json();
  }
}

export const holidayService = new HolidayServiceFrontend();
