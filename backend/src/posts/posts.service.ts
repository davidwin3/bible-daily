import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as LikeOperator } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';

@Injectable()
export class PostsService {
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

  async findAll(getPostsDto: GetPostsDto) {
    const { page = 1, limit = 20, search, author } = getPostsDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .loadRelationCountAndMap('post.likeCount', 'post.likes')
      .where('post.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('post.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search OR post.bibleVerse LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (author) {
      queryBuilder.andWhere('author.realName LIKE :author', {
        author: `%${author}%`,
      });
    }

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .loadRelationCountAndMap('post.likeCount', 'post.likes')
      .where('post.id = :id', { id })
      .andWhere('post.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
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
    return await this.findOne(id);
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

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.findOne(postId);

    if (post.authorId === userId) {
      throw new ForbiddenException('You cannot like your own post');
    }

    const existingLike = await this.likesRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      // Unlike
      await this.likesRepository.remove(existingLike);
      const likeCount = await this.likesRepository.count({ where: { postId } });
      return { liked: false, likeCount };
    } else {
      // Like
      const like = this.likesRepository.create({ postId, userId });
      await this.likesRepository.save(like);
      const likeCount = await this.likesRepository.count({ where: { postId } });
      return { liked: true, likeCount };
    }
  }

  async getLikeStatus(postId: string, userId: string): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }
}
