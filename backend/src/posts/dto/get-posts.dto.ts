import { IsOptional, IsString, IsNumberString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPostsDto {
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  author?: string;
}
