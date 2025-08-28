import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCellDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
