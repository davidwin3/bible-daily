import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserMission } from './user-mission.entity';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  @Column({ length: 100 })
  startBook: string;

  @Column()
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

  // Virtual field for completion stats
  completionCount?: number;
  totalUsers?: number;
  completionRate?: number;
}
