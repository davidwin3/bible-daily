import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bibleVerse?: string;
}
