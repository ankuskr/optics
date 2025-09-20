import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../libs/base-entity';
@Entity({ name: 'tab_authtoken' })
export class Auth extends BaseEntity {
    @ApiProperty()
    @Column({ type: 'int', default: 0 })
    userid: number;

    @ApiProperty()
    @Column({ type: 'longtext', nullable: false })
    jwttoken: string;

    @ApiProperty()
    @Column({ type: 'longtext', nullable: true })
    refreshtoken: string;

    @ApiProperty()
    @Column({ type: 'bool', default: true })
    active: boolean;

    @ApiProperty()
    @Column({ type: 'int', default: 0 })
    iat: number;

    @ApiProperty()
    @Column({ type: 'int', default: 0 })
    exp: number;
}
