import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateMissionScriptureDto {
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

  @IsNumber()
  @Min(0)
  order: number;
}

