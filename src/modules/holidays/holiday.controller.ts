import { HolidayService } from './holiday.service';
import { CreateHolidayDto, UpdateHolidayDto, QueryHolidayFilterDto } from './holiday.dto';
import { ApiHolidayResponseItem, ApiResponsePayload } from './holiday.entity';

export class HolidayController {
  private service: HolidayService;

  constructor(service?: HolidayService) {
    this.service = service || new HolidayService();
  }

  async getHolidays(
    query: QueryHolidayFilterDto = {}
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem[]>> {
    try {
      return await this.service.getHolidays(query);
    } catch (error: any) {
      return this.formatErrorResponse(error);
    }
  }

  async getHolidaysByYear(
    year: number,
    country?: string
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem[]>> {
    try {
      return await this.service.getHolidaysByYear(year, country);
    } catch (error: any) {
      return this.formatErrorResponse(error);
    }
  }

  async getHolidayById(id: string): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    try {
      return await this.service.getHolidayById(id);
    } catch (error: any) {
      return this.formatErrorResponse(error);
    }
  }

  async createHoliday(
    dto: CreateHolidayDto,
    userRole: string = 'ADMIN'
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    try {
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'HR_ADMIN') {
        return {
          success: false,
          data: null as any,
          message: 'UNAUTHORIZED: Only Admin or HR Admin can create holidays.',
          errorCode: 'UNAUTHORIZED_ADMIN_OPERATION',
        };
      }
      return await this.service.createHoliday(dto);
    } catch (error: any) {
      return this.formatErrorResponse(error);
    }
  }

  async updateHoliday(
    id: string,
    dto: UpdateHolidayDto,
    userRole: string = 'ADMIN'
  ): Promise<ApiResponsePayload<ApiHolidayResponseItem>> {
    try {
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'HR_ADMIN') {
        return {
          success: false,
          data: null as any,
          message: 'UNAUTHORIZED: Only Admin or HR Admin can update holidays.',
          errorCode: 'UNAUTHORIZED_ADMIN_OPERATION',
        };
      }
      return await this.service.updateHoliday(id, dto);
    } catch (error: any) {
      return this.formatErrorResponse(error);
    }
  }

  async deleteHoliday(
    id: string,
    userRole: string = 'ADMIN'
  ): Promise<ApiResponsePayload<{ id: string }>> {
    try {
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'HR_ADMIN') {
        return {
          success: false,
          data: null as any,
          message: 'UNAUTHORIZED: Only Admin or HR Admin can delete holidays.',
          errorCode: 'UNAUTHORIZED_ADMIN_OPERATION',
        };
      }
      return await this.service.deleteHoliday(id);
    } catch (error: any) {
      return this.formatErrorResponse(error);
    }
  }

  private formatErrorResponse(error: any): ApiResponsePayload<any> {
    const msg = error.message || 'Unable to process holiday request';
    const code = msg.split(':')[0] || 'HOLIDAY_FETCH_FAILED';
    return {
      success: false,
      data: null,
      message: msg,
      errorCode: code,
    };
  }
}
