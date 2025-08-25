import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetMissionsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  month?: string; // YYYY-MM format
}
