import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Like } from './like.entity';

@Entity('posts')
@Index('idx_posts_is_deleted', ['isDeleted'])
@Index('idx_posts_created_at', ['createdAt'])
@Index('idx_posts_author_id', ['authorId'])
@Index('idx_posts_active_posts', ['isDeleted', 'createdAt'])
@Index('idx_posts_search_title', ['title'])
// @Index('idx_posts_search_content', ['content']) // FULLTEXT 인덱스는 별도 스크립트에서 생성
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  @Column({ nullable: true, length: 200 })
  bibleVerse: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @Column({ nullable: true, length: 100 })
  @Index('idx_posts_client_id')
  clientId: string; // 오프라인 동기화를 위한 클라이언트 ID

  // Relations
  @ManyToOne(() => User, (user) => user.posts, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  // Virtual fields for computed values
  likeCount?: number;
  isLiked?: boolean;
}
