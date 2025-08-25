import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Mission } from './mission.entity';

@Entity('user_missions')
@Unique(['userId', 'missionId'])
export class UserMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

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
