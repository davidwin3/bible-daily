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
@Index('idx_posts_created_at', ['createdAt']) // 최신순 정렬용
@Index('idx_posts_author_created', ['authorId', 'createdAt']) // 작성자별 게시물 조회용
@Index('idx_posts_deleted_created', ['isDeleted', 'createdAt']) // 활성 게시물 조회용
@Index('idx_posts_fulltext', ['title', 'content'], { fulltext: true }) // 전문 검색용 (MySQL)
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  @Index('idx_posts_title') // 제목 검색용
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

