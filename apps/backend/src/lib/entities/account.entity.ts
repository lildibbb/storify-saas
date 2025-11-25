import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('account')
export class Account {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  accountId: string;

  @Column({ type: 'varchar', length: 100 })
  providerId: string;

  @Column({ type: 'text', nullable: true })
  accessToken: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  accessTokenExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  scope: string | null;

  @Column({ type: 'text', nullable: true })
  idToken: string | null;

  @Column({ type: 'text', nullable: true })
  password: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
