import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserMission } from './user-mission.entity';
import { MissionScripture } from './mission-scripture.entity';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  // 하위 호환성을 위해 유지하되, nullable로 변경 (deprecated)
  @Column({ length: 100, nullable: true })
  startBook: string;

  @Column({ nullable: true })
  startChapter: number;

  @Column({ nullable: true })
  startVerse: number;

  @Column({ length: 100, nullable: true })
  endBook: string;

  @Column({ nullable: true })
  endChapter: number;

  @Column({ nullable: true })
  endVerse: number;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserMission, (userMission) => userMission.mission)
  userMissions: UserMission[];

  @OneToMany(() => MissionScripture, (scripture) => scripture.mission, {
    cascade: true,
    eager: true,
  })
  scriptures: MissionScripture[];

  // Virtual field for completion stats
  completionCount?: number;
  totalUsers?: number;
  completionRate?: number;
}
