import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Post } from './post.entity';
import { Like } from './like.entity';
import { UserMission } from './user-mission.entity';
import { CellMember } from './cell-member.entity';
import { RefreshToken } from './refresh-token.entity';
import { FcmToken } from './fcm-token.entity';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Entity('users')
@Index('idx_users_is_active', ['isActive'])
@Index('idx_users_role', ['role'])
@Index('idx_users_last_login_at', ['lastLoginAt'])
@Index('idx_users_active_users', ['isActive', 'role'])
@Index('idx_users_recent_login', ['isActive', 'lastLoginAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profileImage: string | null;

  @Column({ unique: true })
  firebaseUid: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  // Relations
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => UserMission, (userMission) => userMission.user)
  userMissions: UserMission[];

  @OneToMany(() => CellMember, (cellMember) => cellMember.user)
  cellMemberships: CellMember[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => FcmToken, (fcmToken) => fcmToken.user)
  fcmTokens: FcmToken[];
}
