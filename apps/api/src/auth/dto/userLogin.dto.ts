import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CandidateGUIDLogin {
  @ApiProperty()
  @IsNotEmpty()
  readonly guid: string;
}