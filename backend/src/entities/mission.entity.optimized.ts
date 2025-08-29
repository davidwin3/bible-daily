import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserMission } from './user-mission.entity';

@Entity('missions')
@Index('idx_missions_date', ['date']) // 날짜별 조회용
@Index('idx_missions_active_date', ['isActive', 'date']) // 활성 미션 날짜별 조회용
@Index('idx_missions_date_range', ['date', 'isActive']) // 기간별 조회용
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  @Column({ length: 50 })
  startBook: string;

  @Column({ type: 'int' })
  startChapter: number;

  @Column({ type: 'int', nullable: true })
  startVerse?: number;

  @Column({ length: 50, nullable: true })
  endBook?: string;

  @Column({ type: 'int', nullable: true })
  endChapter?: number;

  @Column({ type: 'int', nullable: true })
  endVerse?: number;

  @Column({ length: 200, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserMission, (userMission) => userMission.mission)
  userMissions: UserMission[];

  // Virtual fields for computed values
  completionCount?: number;
  totalUsers?: number;
  completionRate?: number;
  isCompleted?: boolean;
}

