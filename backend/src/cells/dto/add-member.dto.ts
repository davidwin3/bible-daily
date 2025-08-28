import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddMemberDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;
}
