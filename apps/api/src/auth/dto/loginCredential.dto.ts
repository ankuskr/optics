import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly loginid: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly password: string;
}
