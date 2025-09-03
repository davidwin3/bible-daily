import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Mission } from './mission.entity';

@Entity('mission_scriptures')
export class MissionScripture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ default: 0 })
  order: number; // 여러 구절의 순서

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Mission, (mission) => mission.scriptures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'missionId' })
  mission: Mission;

  @Column()
  missionId: string;
}

