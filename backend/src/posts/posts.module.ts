import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Like])],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
