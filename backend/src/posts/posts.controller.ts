import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return await this.postsService.create(createPostDto, req.user.id);
  }

  @Public()
  @Get()
  async findAll(@Query(ValidationPipe) getPostsDto: GetPostsDto) {
    return await this.postsService.findAll(getPostsDto);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    return await this.postsService.update(id, updatePostDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.postsService.remove(id, req.user.id);
    return { message: 'Post deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req) {
    return await this.postsService.toggleLike(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/like-status')
  async getLikeStatus(@Param('id') id: string, @Request() req) {
    const liked = await this.postsService.getLikeStatus(id, req.user.id);
    return { liked };
  }
}
