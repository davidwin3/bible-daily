import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @IsString()
  @IsNotEmpty({ message: '실명을 입력해주세요.' })
  @MinLength(2, { message: '실명은 2자 이상 입력해주세요.' })
  @MaxLength(100, { message: '실명은 100자 이하로 입력해주세요.' })
  realName: string;

  @IsString()
  @IsNotEmpty()
  firebaseToken: string;
}
