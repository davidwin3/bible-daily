import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_token', ['token'])
@Index('idx_refresh_tokens_expires_at', ['expiresAt'])
@Index('idx_refresh_tokens_is_revoked', ['isRevoked'])
@Index('idx_refresh_tokens_valid_tokens', ['userId', 'isRevoked', 'expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  token: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  revokedByIp?: string;

  @Column({ nullable: true })
  replacedByToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 토큰이 유효한지 확인하는 메서드
  isValid(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  // 토큰을 무효화하는 메서드
  revoke(ip?: string, replacedBy?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedByIp = ip;
    this.replacedByToken = replacedBy;
  }
}
