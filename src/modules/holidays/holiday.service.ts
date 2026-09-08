import { parseISO, format, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns';
import { HolidayRepository } from './holiday.repository';
import { ExternalHolidayProviderService } from './external-holiday-provider.service';
import { HolidayEntity, ApiHolidayResponseItem, ApiResponsePayload } from './holiday.entity';
import { CreateHolidayDto, UpdateHolidayDto, QueryHolidayFilterDto } from './holiday.dto';

export class HolidayService {
  private repository: HolidayRepository;
  private externalProvider: ExternalHolidayProviderService;

  constructor(
    repository?: HolidayRepository,
    externalProvider?: ExternalHolidayProviderService
  ) {
    this.repository = repository || new HolidayRepository();
    this.externalProvider = externalProvider || new ExternalHolidayProviderService();
  }

  /**
   * Main Service Flow:
   * GET /api/holidays -> Check repository -> If empty for year, fetch external -> Normalize -> Return ApiHolidayResponseItem[]
   */
  async getHolidays(
    filter: QueryHolidayFilterDto = {}
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem[]>> {
    const year = filter.year || new Date().getFullYear();
    const country = filter.country || 'IN';

    // Step 1: Check Database records for requested year & country
    let dbItems = await this.repository.findByYearAndCountry(year, country);

    // Step 2: If DB has 0 records, fetch from External Holiday Provider
    if (dbItems.length === 0) {
      const fetchedExternal = await this.externalProvider.fetchExternalHolidays(year, country);
      await this.repository.createMany(fetchedExternal);
      dbItems = await this.repository.findByYearAndCountry(year, country);
    }

    // Step 3: Apply filter options (category, state, pagination)
    let filtered = [...dbItems];
    if (filter.category) {
      filtered = filtered.filter((h) => h.category === filter.category);
    }
    if (filter.state) {
      filtered = filtered.filter(
        (h) => h.state && h.state.toLowerCase() === filter.state?.toLowerCase()
      );
    }

    const total = filtered.length;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 50;
    const start = (page - 1) * limit;
    const pagedItems = filtered.slice(start, start + limit);

    // Step 4: Normalize response items with dynamic dayOfWeek and relativeLabel
    const normalizedData: ApiHolidayResponseItem[] = pagedItems.map((item) =>
      this.normalizeHolidayItem(item)
    );

    return {
      success: true,
      data: normalizedData,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getHolidaysByYear(
    year: number,
    country: string = 'IN'
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem[]>> {
    return this.getHolidays({ year: Number(year), country });
  }

  async getHolidayById(id: string): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error(`HOLIDAY_NOT_FOUND: Holiday with ID ${id} not found.`);
    }

    return {
      success: true,
      data: this.normalizeHolidayItem(item),
    };
  }

  async createHoliday(dto: CreateHolidayDto): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    // Validation
    if (!dto.name || !dto.name.trim()) {
      throw new Error('VALIDATION_ERROR: Holiday name is required.');
    }
    if (!dto.date || isNaN(Date.parse(dto.date))) {
      throw new Error('INVALID_DATE: Valid date in YYYY-MM-DD format is required.');
    }
    if (!dto.category) {
      throw new Error('VALIDATION_ERROR: Holiday category is required.');
    }

    const country = dto.country || 'IN';
    const existing = await this.repository.findDuplicate(dto.name, dto.date, country);
    if (existing) {
      throw new Error(`DUPLICATE_HOLIDAY: Holiday "${dto.name}" on ${dto.date} already exists.`);
    }

    const created = await this.repository.create({
      ...dto,
      country,
    });

    return {
      success: true,
      data: this.normalizeHolidayItem(created),
      message: 'Holiday created successfully.',
    };
  }

  async updateHoliday(
    id: string,
    dto: UpdateHolidayDto
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`HOLIDAY_NOT_FOUND: Holiday with ID ${id} not found.`);
    }

    if (dto.date && isNaN(Date.parse(dto.date))) {
      throw new Error('INVALID_DATE: Valid date in YYYY-MM-DD format is required.');
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error('UPDATE_FAILED: Failed to update holiday record.');
    }

    return {
      success: true,
      data: this.normalizeHolidayItem(updated),
      message: 'Holiday updated successfully.',
    };
  }

  async deleteHoliday(id: string): Promise<ApiResponsePayload<{ id: string }>> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`HOLIDAY_NOT_FOUND: Holiday with ID ${id} not found.`);
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error('DELETE_FAILED: Unable to delete holiday.');
    }

    return {
      success: true,
      data: { id },
      message: 'Holiday deleted successfully.',
    };
  }

  /**
   * Helper method to normalize a raw HolidayEntity into an ApiHolidayResponseItem.
   * Uses date-fns to format dayOfWeek and calculate dynamic relativeLabel.
   */
  private normalizeHolidayItem(item: HolidayEntity): ApiHolidayResponseItem {
    const parsedDate = parseISO(item.date);
    const dayOfWeek = format(parsedDate, 'EEEE');
    const relativeLabel = this.calculateDynamicRelativeLabel(parsedDate);

    return {
      id: item.id,
      name: item.name,
      description: item.description || null,
      date: item.date,
      dayOfWeek,
      relativeLabel,
      category: item.category,
      country: item.country,
      state: item.state || null,
      isOptional: item.isOptional,
      isMandatory: item.isMandatory,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private calculateDynamicRelativeLabel(targetDate: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    if (isToday(target)) {
      return 'Today';
    }
    if (isTomorrow(target)) {
      return 'Tomorrow';
    }

    const diffDays = differenceInCalendarDays(target, today);
    if (diffDays > 1 && diffDays <= 30) {
      return `In ${diffDays} days`;
    }
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    }

    return format(target, 'dd MMM');
  }
}
