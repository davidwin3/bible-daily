import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Cell } from './cell.entity';

@Entity('cell_members')
@Unique(['userId', 'cellId'])
export class CellMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  leftAt: Date;

  @Column({ default: 'member' })
  role: string;

  // Relations
  @ManyToOne(() => User, (user) => user.cellMemberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Cell, (cell) => cell.members, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cellId' })
  cell: Cell;

  @Column()
  cellId: string;
}
