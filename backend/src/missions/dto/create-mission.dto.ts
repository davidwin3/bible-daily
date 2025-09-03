import {
  IsDateString,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMissionScriptureDto } from './create-mission-scripture.dto';

export class CreateMissionDto {
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMissionScriptureDto)
  scriptures: CreateMissionScriptureDto[];

  // 하위 호환성을 위한 필드들 (optional)
  @IsOptional()
  @IsString()
  @Length(1, 100)
  startBook?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(150)
  startChapter?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  startVerse?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  endBook?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(150)
  endChapter?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  endVerse?: number;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;
}
