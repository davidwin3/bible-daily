import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Cell } from './cell.entity';

@Entity('cell_members')
@Unique(['userId', 'cellId'])
@Index('idx_cell_members_user_id', ['userId'])
@Index('idx_cell_members_cell_id', ['cellId'])
@Index('idx_cell_members_is_active', ['isActive'])
@Index('idx_cell_members_user_active', ['userId', 'isActive'])
@Index('idx_cell_members_cell_active', ['cellId', 'isActive'])
@Index('idx_cell_members_joined_at', ['joinedAt'])
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
