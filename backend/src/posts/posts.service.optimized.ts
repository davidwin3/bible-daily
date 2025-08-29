import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';

@Injectable()
export class PostsServiceOptimized {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      authorId,
    });

    return await this.postsRepository.save(post);
  }

  /**
   * 최적화된 게시물 목록 조회
   * - 단일 쿼리로 모든 데이터 조회 (N+1 문제 해결)
   * - 사용자별 좋아요 상태를 한 번에 조회
   * - 인덱스 활용을 위한 쿼리 최적화
   */
  async findAll(getPostsDto: GetPostsDto, userId?: string) {
    const { page = 1, limit = 20, search, author } = getPostsDto;
    const offset = (page - 1) * limit;

    // 메인 쿼리 빌더
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likes', 'like')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('post.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('post.id, author.id')
      .orderBy('post.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    // 사용자별 좋아요 상태 조회 (로그인한 경우)
    if (userId) {
      queryBuilder
        .leftJoin('post.likes', 'userLike', 'userLike.userId = :userId', {
          userId,
        })
        .addSelect(
          'CASE WHEN userLike.id IS NOT NULL THEN true ELSE false END',
          'isLiked',
        );
    }

    // 검색 조건 (Full-text search 인덱스 활용)
    if (search) {
      queryBuilder.andWhere(
        '(MATCH(post.title, post.content) AGAINST(:search IN NATURAL LANGUAGE MODE) OR post.bibleVerse LIKE :searchLike)',
        {
          search,
          searchLike: `%${search}%`,
        },
      );
    }

    // 작성자 필터
    if (author) {
      queryBuilder.andWhere('author.name LIKE :author', {
        author: `%${author}%`,
      });
    }

    // 총 개수 조회를 위한 별도 쿼리 (성능 최적화)
    const countQuery = this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .where('post.isDeleted = :isDeleted', { isDeleted: false });

    if (search) {
      countQuery.andWhere(
        '(MATCH(post.title, post.content) AGAINST(:search IN NATURAL LANGUAGE MODE) OR post.bibleVerse LIKE :searchLike)',
        {
          search,
          searchLike: `%${search}%`,
        },
      );
    }

    if (author) {
      countQuery.andWhere('author.name LIKE :author', {
        author: `%${author}%`,
      });
    }

    // 병렬 실행으로 성능 향상
    const [posts, total] = await Promise.all([
      queryBuilder.getRawAndEntities(),
      countQuery.getCount(),
    ]);

    // 결과 매핑
    const mappedPosts = posts.entities.map((post, index) => ({
      ...post,
      likeCount: parseInt(posts.raw[index].likeCount) || 0,
      isLiked: userId ? posts.raw[index].isLiked === '1' : false,
    }));

    return {
      posts: mappedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 최적화된 단일 게시물 조회
   */
  async findOne(id: string, userId?: string): Promise<Post> {
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likes', 'like')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('post.id = :id', { id })
      .andWhere('post.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('post.id, author.id');

    if (userId) {
      queryBuilder
        .leftJoin('post.likes', 'userLike', 'userLike.userId = :userId', {
          userId,
        })
        .addSelect(
          'CASE WHEN userLike.id IS NOT NULL THEN true ELSE false END',
          'isLiked',
        );
    }

    const result = await queryBuilder.getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException('Post not found');
    }

    const post = result.entities[0];
    const raw = result.raw[0];

    return {
      ...post,
      likeCount: parseInt(raw.likeCount) || 0,
      isLiked: userId ? raw.isLiked === '1' : false,
    } as Post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    await this.postsRepository.update(id, updatePostDto);
    return await this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  /**
   * 최적화된 좋아요 토글
   * - 트랜잭션 사용으로 데이터 일관성 보장
   * - 단일 쿼리로 좋아요 수 계산
   */
  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    return await this.postsRepository.manager.transaction(async (manager) => {
      // 게시물 존재 확인
      const post = await manager.findOne(Post, {
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.authorId === userId) {
        throw new ForbiddenException('You cannot like your own post');
      }

      // 기존 좋아요 확인
      const existingLike = await manager.findOne(Like, {
        where: { postId, userId },
      });

      let liked: boolean;

      if (existingLike) {
        // 좋아요 취소
        await manager.remove(existingLike);
        liked = false;
      } else {
        // 좋아요 추가
        const like = manager.create(Like, { postId, userId });
        await manager.save(like);
        liked = true;
      }

      // 좋아요 수 계산
      const likeCount = await manager.count(Like, { where: { postId } });

      return { liked, likeCount };
    });
  }

  async getLikeStatus(postId: string, userId: string): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  /**
   * 인기 게시물 조회 (캐시 활용 권장)
   */
  async getPopularPosts(limit: number = 10): Promise<Post[]> {
    return await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likes', 'like')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('post.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('post.createdAt >= :weekAgo', {
        weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .groupBy('post.id, author.id')
      .orderBy('likeCount', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit)
      .getRawAndEntities()
      .then((result) =>
        result.entities.map((post, index) => ({
          ...post,
          likeCount: parseInt(result.raw[index].likeCount) || 0,
        })),
      );
  }
}

