import { HolidayEntity } from './holiday.entity';
import { CreateHolidayDto, UpdateHolidayDto, QueryHolidayFilterDto } from './holiday.dto';

export class HolidayRepository {
  private memoryDb: HolidayEntity[] = [];

  constructor() {
    // Seed initial database records
    const currentYear = new Date().getFullYear();
    this.memoryDb = [
      {
        id: 'hol-001',
        name: 'Ganesh Chaturthi',
        description: 'Festival Holiday',
        date: `${currentYear}-08-27`,
        category: 'PUBLIC_HOLIDAY',
        country: 'IN',
        state: null,
        isOptional: false,
        isMandatory: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hol-002',
        name: 'Onam',
        description: 'Company Harvest Festival',
        date: `${currentYear}-08-26`,
        category: 'COMPANY_FESTIVAL',
        country: 'IN',
        state: null,
        isOptional: false,
        isMandatory: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hol-003',
        name: 'Gandhi Jayanti',
        description: 'National Freedom Holiday',
        date: `${currentYear}-10-02`,
        category: 'NATIONAL_HOLIDAY',
        country: 'IN',
        state: null,
        isOptional: false,
        isMandatory: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hol-004',
        name: 'Diwali',
        description: 'Festival of Lights',
        date: `${currentYear}-11-08`,
        category: 'COMPANY_FESTIVAL',
        country: 'IN',
        state: null,
        isOptional: false,
        isMandatory: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hol-005',
        name: 'Christmas',
        description: 'Year End Public Holiday',
        date: `${currentYear}-12-25`,
        category: 'PUBLIC_HOLIDAY',
        country: 'IN',
        state: null,
        isOptional: false,
        isMandatory: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async findAll(filter: QueryHolidayFilterDto = {}): Promise<{ items: HolidayEntity[]; total: number }> {
    let result = [...this.memoryDb];

    if (filter.year) {
      result = result.filter((item) => new Date(item.date).getFullYear() === Number(filter.year));
    }
    if (filter.country) {
      result = result.filter((item) => item.country.toLowerCase() === filter.country?.toLowerCase());
    }
    if (filter.category) {
      result = result.filter((item) => item.category === filter.category);
    }
    if (filter.state) {
      result = result.filter((item) => item.state && item.state.toLowerCase() === filter.state?.toLowerCase());
    }

    const total = result.length;
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const start = (page - 1) * limit;

    return {
      items: result.slice(start, start + limit),
      total,
    };
  }

  async findById(id: string): Promise<HolidayEntity | null> {
    return this.memoryDb.find((item) => item.id === id) || null;
  }

  async findByYearAndCountry(year: number, country: string): Promise<HolidayEntity[]> {
    return this.memoryDb.filter((item) => {
      const itemYear = new Date(item.date).getFullYear();
      return itemYear === year && item.country.toLowerCase() === country.toLowerCase();
    });
  }

  async findDuplicate(name: string, date: string, country: string): Promise<HolidayEntity | null> {
    return (
      this.memoryDb.find(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() &&
          item.date === date &&
          item.country.toLowerCase() === country.toLowerCase()
      ) || null
    );
  }

  async create(dto: CreateHolidayDto): Promise<HolidayEntity> {
    const created: HolidayEntity = {
      id: `hol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: dto.name,
      description: dto.description || null,
      date: dto.date,
      category: dto.category,
      country: dto.country || 'IN',
      state: dto.state || null,
      isOptional: dto.isOptional ?? false,
      isMandatory: dto.isMandatory ?? true,
      status: dto.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memoryDb.push(created);
    return created;
  }

  async createMany(dtos: Omit<HolidayEntity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<HolidayEntity[]> {
    const createdItems: HolidayEntity[] = [];

    dtos.forEach((dto, idx) => {
      const exists = this.memoryDb.some(
        (item) => item.name.toLowerCase() === dto.name.toLowerCase() && item.date === dto.date
      );
      if (!exists) {
        const created: HolidayEntity = {
          ...dto,
          id: `hol-ext-${Date.now()}-${idx}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.memoryDb.push(created);
        createdItems.push(created);
      }
    });

    return createdItems;
  }

  async update(id: string, dto: UpdateHolidayDto): Promise<HolidayEntity | null> {
    const index = this.memoryDb.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated: HolidayEntity = {
      ...this.memoryDb[index],
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.memoryDb[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.memoryDb.length;
    this.memoryDb = this.memoryDb.filter((item) => item.id !== id);
    return this.memoryDb.length < initialLength;
  }
}
