import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Mission } from './mission.entity';

@Entity('user_missions')
@Unique('uk_user_mission', ['userId', 'missionId']) // 사용자-미션 유니크 제약
@Index('idx_user_missions_user_completed', ['userId', 'isCompleted']) // 사용자별 완료 상태 조회용
@Index('idx_user_missions_mission_completed', ['missionId', 'isCompleted']) // 미션별 완료 통계용
@Index('idx_user_missions_completed_at', ['completedAt']) // 완료 시간별 조회용
@Index('idx_user_missions_user_created', ['userId', 'createdAt']) // 사용자별 진행률 조회용
export class UserMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userMissions, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Mission, (mission) => mission.userMissions, {
    nullable: false,
  })
  @JoinColumn({ name: 'missionId' })
  mission: Mission;

  @Column()
  missionId: string;
}

