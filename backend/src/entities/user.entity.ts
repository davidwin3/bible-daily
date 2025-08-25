import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Like } from './like.entity';
import { UserMission } from './user-mission.entity';
import { CellMember } from './cell-member.entity';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  profileImage: string;

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
  lastLoginAt: Date;

  // Relations
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => UserMission, (userMission) => userMission.user)
  userMissions: UserMission[];

  @OneToMany(() => CellMember, (cellMember) => cellMember.user)
  cellMemberships: CellMember[];
}
