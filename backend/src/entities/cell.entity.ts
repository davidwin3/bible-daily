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
import { User } from './user.entity';
import { CellMember } from './cell-member.entity';

@Entity('cells')
export class Cell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'leaderId' })
  leader: User;

  @Column()
  leaderId: string;

  @OneToMany(() => CellMember, (cellMember) => cellMember.cell)
  members: CellMember[];

  // Virtual fields
  memberCount?: number;
}
