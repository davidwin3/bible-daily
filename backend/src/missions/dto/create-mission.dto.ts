import {
  IsDateString,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateMissionDto {
  @IsDateString()
  date: string;

  @IsString()
  @Length(1, 100)
  startBook: string;

  @IsNumber()
  @Min(1)
  @Max(150)
  startChapter: number;

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
