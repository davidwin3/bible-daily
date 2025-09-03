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
