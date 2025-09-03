import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Mission } from './mission.entity';

@Entity('user_missions')
@Unique(['userId', 'missionId'])
@Index('idx_user_missions_user_id', ['userId'])
@Index('idx_user_missions_mission_id', ['missionId'])
@Index('idx_user_missions_is_completed', ['isCompleted'])
@Index('idx_user_missions_created_at', ['createdAt'])
@Index('idx_user_missions_user_completed', ['userId', 'isCompleted'])
@Index('idx_user_missions_mission_completed', ['missionId', 'isCompleted'])
@Index('idx_user_missions_recent_activity', ['userId', 'createdAt'])
export class UserMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userMissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Mission, (mission) => mission.userMissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'missionId' })
  mission: Mission;

  @Column()
  missionId: string;
}
