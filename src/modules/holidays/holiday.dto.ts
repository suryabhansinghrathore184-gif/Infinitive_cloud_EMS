import { HolidayCategoryType } from './holiday.entity';

export interface CreateHolidayDto {
  name: string;
  description?: string;
  date: string; // YYYY-MM-DD
  category: HolidayCategoryType;
  country?: string;
  state?: string;
  isOptional?: boolean;
  isMandatory?: boolean;
  status?: 'ACTIVE' | 'DISABLED';
}

export interface UpdateHolidayDto {
  name?: string;
  description?: string;
  date?: string;
  category?: HolidayCategoryType;
  country?: string;
  state?: string;
  isOptional?: boolean;
  isMandatory?: boolean;
  status?: 'ACTIVE' | 'DISABLED';
}

export interface QueryHolidayFilterDto {
  year?: number;
  country?: string;
  category?: HolidayCategoryType;
  state?: string;
  page?: number;
  limit?: number;
}
