import { IsString, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateCellDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsUUID()
  leaderId: string;
}
