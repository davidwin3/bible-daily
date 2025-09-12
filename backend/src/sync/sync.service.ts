import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { UserMission } from '../entities/user-mission.entity';
import { Mission } from '../entities/mission.entity';
import { User } from '../entities/user.entity';
import { SyncDataDto, OfflineAction } from './dto/sync-data.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(UserMission)
    private readonly userMissionRepository: Repository<UserMission>,
    @InjectRepository(Mission)
    private readonly missionRepository: Repository<Mission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 오프라인에서 저장된 데이터들을 서버와 동기화
   */
  async syncOfflineData(syncDataDto: SyncDataDto, userId: string) {
    const { actions } = syncDataDto;
    const results: {
      successful: Array<{
        id: string;
        type: string;
        message: string;
      }>;
      failed: Array<{
        id: string;
        type: string;
        error: string;
      }>;
      total: number;
    } = {
      successful: [],
      failed: [],
      total: actions.length,
    };

    this.logger.log(
      `Starting sync for user ${userId} with ${actions.length} actions`,
    );

    // 트랜잭션으로 처리
    await this.dataSource.transaction(async (manager) => {
      for (const action of actions) {
        try {
          await this.processOfflineAction(action, userId, manager);
          results.successful.push({
            id: action.id,
            type: action.type,
            message: 'Successfully synced',
          });
        } catch (error) {
          this.logger.error(`Failed to sync action ${action.id}:`, error);
          results.failed.push({
            id: action.id,
            type: action.type,
            error: error.message,
          });
        }
      }
    });

    this.logger.log(
      `Sync completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    );

    return {
      success: true,
      results,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * 개별 오프라인 액션 처리
   */
  private async processOfflineAction(
    action: OfflineAction,
    userId: string,
    manager: any,
  ) {
    switch (action.type) {
      case 'CREATE_POST':
        await this.syncCreatePost(action, userId, manager);
        break;
      case 'TOGGLE_LIKE':
        await this.syncToggleLike(action, userId, manager);
        break;
      case 'COMPLETE_MISSION':
        await this.syncCompleteMission(action, userId, manager);
        break;
      case 'UPDATE_POST':
        await this.syncUpdatePost(action, userId, manager);
        break;
      case 'DELETE_POST':
        await this.syncDeletePost(action, userId, manager);
        break;
      default:
        throw new BadRequestException(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * 게시물 생성 동기화
   */
  private async syncCreatePost(
    action: OfflineAction,
    userId: string,
    manager: any,
  ) {
    const { data } = action;

    // 중복 확인 (클라이언트 ID 기반)
    if (data.clientId) {
      const existingPost = await manager.findOne(Post, {
        where: { clientId: data.clientId, authorId: userId },
      });

      if (existingPost) {
        this.logger.warn(`Post with clientId ${data.clientId} already exists`);
        return;
      }
    }

    const post = manager.create(Post, {
      title: data.title,
      content: data.content,
      bibleVerse: data.bibleVerse,
      authorId: userId,
      clientId: data.clientId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save(post);
    this.logger.log(`Created post: ${post.id}`);
  }

  /**
   * 좋아요 토글 동기화
   */
  private async syncToggleLike(
    action: OfflineAction,
    userId: string,
    manager: any,
  ) {
    const { data } = action;
    const postId = data.postId;

    const existingLike = await manager.findOne(Like, {
      where: { postId, userId },
    });

    if (data.isLiked && !existingLike) {
      // 좋아요 추가
      const like = manager.create(Like, { postId, userId });
      await manager.save(like);
      this.logger.log(`Added like: post ${postId}, user ${userId}`);
    } else if (!data.isLiked && existingLike) {
      // 좋아요 제거
      await manager.remove(existingLike);
      this.logger.log(`Removed like: post ${postId}, user ${userId}`);
    }
  }

  /**
   * 미션 완료 동기화
   */
  private async syncCompleteMission(
    action: OfflineAction,
    userId: string,
    manager: any,
  ) {
    const { data } = action;
    const missionId = data.missionId;

    // 미션 존재 확인
    const mission = await manager.findOne(Mission, {
      where: { id: missionId },
    });
    if (!mission) {
      throw new BadRequestException(`Mission ${missionId} not found`);
    }

    let userMission = await manager.findOne(UserMission, {
      where: { missionId, userId },
    });

    if (!userMission) {
      userMission = manager.create(UserMission, {
        missionId,
        userId,
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date() : null,
      });
    } else {
      userMission.isCompleted = data.isCompleted;
      userMission.completedAt = data.isCompleted ? new Date() : null;
    }

    await manager.save(userMission);
    this.logger.log(
      `Updated mission completion: mission ${missionId}, user ${userId}, completed: ${data.isCompleted}`,
    );
  }

  /**
   * 게시물 수정 동기화
   */
  private async syncUpdatePost(
    action: OfflineAction,
    userId: string,
    manager: any,
  ) {
    const { data } = action;
    const postId = data.postId;

    const post = await manager.findOne(Post, {
      where: { id: postId, authorId: userId },
    });

    if (!post) {
      throw new BadRequestException(
        `Post ${postId} not found or not owned by user`,
      );
    }

    if (data.title !== undefined) post.title = data.title;
    if (data.content !== undefined) post.content = data.content;
    if (data.bibleVerse !== undefined) post.bibleVerse = data.bibleVerse;
    post.updatedAt = new Date();

    await manager.save(post);
    this.logger.log(`Updated post: ${postId}`);
  }

  /**
   * 게시물 삭제 동기화
   */
  private async syncDeletePost(
    action: OfflineAction,
    userId: string,
    manager: any,
  ) {
    const { data } = action;
    const postId = data.postId;

    const post = await manager.findOne(Post, {
      where: { id: postId, authorId: userId },
    });

    if (!post) {
      this.logger.warn(
        `Post ${postId} not found or not owned by user ${userId}`,
      );
      return;
    }

    // 소프트 삭제
    post.isDeleted = true;
    post.deletedAt = new Date();
    await manager.save(post);

    this.logger.log(`Deleted post: ${postId}`);
  }

  /**
   * 사용자별 동기화 상태 확인
   */
  async getSyncStatus(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 최근 활동 정보 조회
    const recentPosts = await this.postRepository.count({
      where: { authorId: userId, isDeleted: false },
    });

    const recentLikes = await this.likeRepository.count({
      where: { userId },
    });

    const completedMissions = await this.userMissionRepository.count({
      where: { userId, isCompleted: true },
    });

    return {
      userId,
      lastSyncAt: user.updatedAt,
      stats: {
        totalPosts: recentPosts,
        totalLikes: recentLikes,
        completedMissions,
      },
      serverTime: new Date().toISOString(),
    };
  }
}
