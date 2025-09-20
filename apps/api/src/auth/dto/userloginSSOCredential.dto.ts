import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserLoginSSODto {
  @ApiProperty()
  @IsNotEmpty()
  readonly loginid: string;
}
