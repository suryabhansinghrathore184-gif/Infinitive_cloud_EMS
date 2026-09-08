// Holiday Entity definition for EMS/HRMS

export type HolidayCategoryType =
  | 'PUBLIC_HOLIDAY'
  | 'NATIONAL_HOLIDAY'
  | 'COMPANY_HOLIDAY'
  | 'COMPANY_FESTIVAL'
  | 'OPTIONAL_HOLIDAY'
  | 'REGIONAL_HOLIDAY';

export interface HolidayEntity {
  id: string;
  name: string;
  description?: string | null;
  date: string; // ISO Format: YYYY-MM-DD
  category: HolidayCategoryType;
  country: string;
  state?: string | null;
  isOptional: boolean;
  isMandatory: boolean;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface ApiHolidayResponseItem extends HolidayEntity {
  dayOfWeek: string;
  relativeLabel: string;
}

export interface ApiResponsePayload<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
