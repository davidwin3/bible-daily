import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class PostsServiceCached {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    private cacheService: CacheService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      authorId,
    });

    const savedPost = await this.postsRepository.save(post);

    // 게시물 관련 캐시 무효화
    await this.cacheService.invalidatePostsCache();

    return savedPost;
  }

  /**
   * 캐시 적용된 게시물 목록 조회
   */
  async findAll(getPostsDto: GetPostsDto, userId?: string) {
    const { page = 1, limit = 20, search, author } = getPostsDto;

    // 캐시 키 생성
    const cacheKey = this.cacheService.getPostsKey(page, limit, search, author);

    // 캐시에서 조회
    let cachedResult = await this.cacheService.get(cacheKey);

    if (cachedResult) {
      // 사용자별 좋아요 상태는 별도 처리 (개인화된 데이터)
      if (userId) {
        cachedResult = await this.addUserLikeStatus(cachedResult, userId);
      }
      return cachedResult;
    }

    // 캐시 미스: DB에서 조회
    const offset = (page - 1) * limit;

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

    if (search) {
      queryBuilder.andWhere(
        '(MATCH(post.title, post.content) AGAINST(:search IN NATURAL LANGUAGE MODE) OR post.bibleVerse LIKE :searchLike)',
        {
          search,
          searchLike: `%${search}%`,
        },
      );
    }

    if (author) {
      queryBuilder.andWhere('author.name LIKE :author', {
        author: `%${author}%`,
      });
    }

    // 총 개수 조회를 위한 별도 쿼리
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

    const [result, total] = await Promise.all([
      queryBuilder.getRawAndEntities(),
      countQuery.getCount(),
    ]);

    // 결과 매핑 (사용자별 데이터 제외)
    const posts = result.entities.map((post, index) => ({
      ...post,
      likeCount: parseInt(result.raw[index].likeCount) || 0,
    }));

    const response = {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // 캐시에 저장 (5분 TTL)
    await this.cacheService.set(cacheKey, response, 300);

    // 사용자별 좋아요 상태 추가
    if (userId) {
      return await this.addUserLikeStatus(response, userId);
    }

    return response;
  }

  /**
   * 캐시 적용된 단일 게시물 조회
   */
  async findOne(id: string, userId?: string): Promise<Post> {
    const cacheKey = this.cacheService.getPostKey(id);

    // 캐시에서 조회
    let cachedPost = await this.cacheService.get<Post>(cacheKey);

    if (cachedPost) {
      // 사용자별 좋아요 상태 추가
      if (userId) {
        const isLiked = await this.getLikeStatus(id, userId);
        cachedPost.isLiked = isLiked;
      }
      return cachedPost;
    }

    // 캐시 미스: DB에서 조회
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likes', 'like')
      .addSelect('COUNT(DISTINCT like.id)', 'likeCount')
      .where('post.id = :id', { id })
      .andWhere('post.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('post.id, author.id');

    const result = await queryBuilder.getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException('Post not found');
    }

    const post = result.entities[0];
    const raw = result.raw[0];

    const postWithStats = {
      ...post,
      likeCount: parseInt(raw.likeCount) || 0,
    } as Post;

    // 캐시에 저장 (10분 TTL)
    await this.cacheService.set(cacheKey, postWithStats, 600);

    // 사용자별 좋아요 상태 추가
    if (userId) {
      const isLiked = await this.getLikeStatus(id, userId);
      postWithStats.isLiked = isLiked;
    }

    return postWithStats;
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

    // 관련 캐시 무효화
    await Promise.all([
      this.cacheService.del(this.cacheService.getPostKey(id)),
      this.cacheService.invalidatePostsCache(),
    ]);

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

    // 관련 캐시 무효화
    await Promise.all([
      this.cacheService.del(this.cacheService.getPostKey(id)),
      this.cacheService.invalidatePostsCache(),
    ]);
  }

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const result = await this.postsRepository.manager.transaction(
      async (manager) => {
        const post = await manager.findOne(Post, {
          where: { id: postId, isDeleted: false },
        });

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        if (post.authorId === userId) {
          throw new ForbiddenException('You cannot like your own post');
        }

        const existingLike = await manager.findOne(Like, {
          where: { postId, userId },
        });

        let liked: boolean;

        if (existingLike) {
          await manager.remove(existingLike);
          liked = false;
        } else {
          const like = manager.create(Like, { postId, userId });
          await manager.save(like);
          liked = true;
        }

        const likeCount = await manager.count(Like, { where: { postId } });

        return { liked, likeCount };
      },
    );

    // 관련 캐시 무효화
    await Promise.all([
      this.cacheService.del(this.cacheService.getPostKey(postId)),
      this.cacheService.invalidatePostsCache(),
    ]);

    return result;
  }

  async getLikeStatus(postId: string, userId: string): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  /**
   * 인기 게시물 조회 (캐시 적용)
   */
  async getPopularPosts(limit: number = 10): Promise<Post[]> {
    const cacheKey = this.cacheService.getPopularPostsKey();

    // 캐시에서 조회
    const cachedPosts = await this.cacheService.get<Post[]>(cacheKey);
    if (cachedPosts) {
      return cachedPosts;
    }

    // 캐시 미스: DB에서 조회
    const result = await this.postsRepository
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
      .getRawAndEntities();

    const posts = result.entities.map((post, index) => ({
      ...post,
      likeCount: parseInt(result.raw[index].likeCount) || 0,
    }));

    // 캐시에 저장 (30분 TTL)
    await this.cacheService.set(cacheKey, posts, 1800);

    return posts;
  }

  /**
   * 사용자별 좋아요 상태 추가 헬퍼
   */
  private async addUserLikeStatus(response: any, userId: string): Promise<any> {
    const postIds = response.posts.map((post: Post) => post.id);

    if (postIds.length === 0) {
      return response;
    }

    // 사용자의 좋아요 상태를 배치로 조회
    const userLikes = await this.likesRepository
      .createQueryBuilder('like')
      .select('like.postId')
      .where('like.userId = :userId', { userId })
      .andWhere('like.postId IN (:...postIds)', { postIds })
      .getRawMany();

    const likedPostIds = new Set(userLikes.map((like) => like.postId));

    // 각 게시물에 좋아요 상태 추가
    response.posts = response.posts.map((post: Post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    return response;
  }
}

