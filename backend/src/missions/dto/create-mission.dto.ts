import {
  IsDateString,
  IsString,
  IsOptional,
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



  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;
}
