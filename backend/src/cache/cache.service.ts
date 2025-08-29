import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 캐시 키 생성 헬퍼
   */
  private generateKey(prefix: string, ...args: (string | number)[]): string {
    return `${prefix}:${args.join(':')}`;
  }

  /**
   * 게시물 관련 캐시 키
   */
  getPostsKey(
    page: number,
    limit: number,
    search?: string,
    author?: string,
  ): string {
    return this.generateKey('posts', page, limit, search || '', author || '');
  }

  getPostKey(id: string, userId?: string): string {
    return this.generateKey('post', id, userId || '');
  }

  getPopularPostsKey(): string {
    return this.generateKey('posts', 'popular');
  }

  /**
   * 미션 관련 캐시 키
   */
  getTodayMissionKey(userId?: string): string {
    const today = new Date().toISOString().split('T')[0];
    return this.generateKey('mission', 'today', today, userId || '');
  }

  getMissionsKey(startDate?: string, endDate?: string, month?: string): string {
    return this.generateKey(
      'missions',
      startDate || '',
      endDate || '',
      month || '',
    );
  }

  getUserProgressKey(userId: string, month?: string): string {
    return this.generateKey('user', 'progress', userId, month || '');
  }

  getMonthlyStatsKey(month: string): string {
    return this.generateKey('stats', 'monthly', month);
  }

  /**
   * 셀 관련 캐시 키
   */
  getCellKey(id: string): string {
    return this.generateKey('cell', id);
  }

  getUserCellKey(userId: string): string {
    return this.generateKey('user', 'cell', userId);
  }

  /**
   * 캐시 조회
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * 캐시 저장
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * 캐시 삭제
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * 패턴 기반 캐시 삭제
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Redis store의 경우
      const stores = (this.cacheManager as any).stores;
      if (stores && stores.length > 0) {
        const store = stores[0];
        if (store.keys) {
          const keys = await store.keys(pattern);
          if (keys.length > 0) {
            await Promise.all(keys.map((key: string) => this.del(key)));
          }
        }
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * 게시물 관련 캐시 무효화
   */
  async invalidatePostsCache(): Promise<void> {
    await Promise.all([this.delPattern('posts:*'), this.delPattern('post:*')]);
  }

  /**
   * 미션 관련 캐시 무효화
   */
  async invalidateMissionsCache(): Promise<void> {
    await Promise.all([
      this.delPattern('mission:*'),
      this.delPattern('missions:*'),
      this.delPattern('user:progress:*'),
      this.delPattern('stats:*'),
    ]);
  }

  /**
   * 사용자별 캐시 무효화
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`*:${userId}`),
      this.delPattern(`user:*:${userId}:*`),
    ]);
  }

  /**
   * 캐시 통계
   */
  async getCacheStats(): Promise<any> {
    try {
      const stores = (this.cacheManager as any).stores;
      if (stores && stores.length > 0) {
        const store = stores[0];
        if (store.client && store.client.info) {
          return await store.client.info('memory');
        }
      }
      return null;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}
