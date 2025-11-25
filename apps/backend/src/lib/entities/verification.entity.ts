import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('verification')
export class Verification {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  identifier: string;

  @Column({ type: 'varchar', length: 500 })
  value: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
