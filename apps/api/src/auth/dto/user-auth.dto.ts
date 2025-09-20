import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ example: 1, description: 'Auto-generated user ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'ankush', description: 'Username of the user' })
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @ApiProperty({
    example: 'ankush@example.com',
    description: 'Email of the user',
  })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @ApiProperty({ example: 'StrongPass123!', description: 'Hashed password' })
  @Column({ type: 'varchar', length: 200 })
  password: string;

  @ApiProperty({
    example: '2025-09-19T00:00:00.000Z',
    description: 'User creation timestamp',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2025-09-19T00:00:00.000Z',
    description: 'Last updated timestamp',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
