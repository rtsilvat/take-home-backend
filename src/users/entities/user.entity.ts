import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index('uq_users_email', { unique: true })
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'flag_active', type: 'boolean', default: true })
  flag_active: boolean;

  @Column({ name: 'expiration_at', type: 'timestamptz', nullable: true })
  expiration_at: Date | null;

  @CreateDateColumn({ name: 'insert_at', type: 'timestamptz' })
  insert_at: Date;

  @UpdateDateColumn({ name: 'update_at', type: 'timestamptz' })
  update_at: Date;
}
