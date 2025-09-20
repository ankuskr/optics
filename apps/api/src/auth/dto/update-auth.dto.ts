import { PartialType } from '@nestjs/swagger';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
