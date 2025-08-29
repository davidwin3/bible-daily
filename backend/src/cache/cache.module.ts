import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');

        if (redisUrl) {
          // 운영 환경: Redis 사용
          return {
            store: redisStore as any,
            url: redisUrl,
            ttl: 300, // 5분 기본 TTL
            max: 1000, // 최대 캐시 항목 수
            isGlobal: true,
          };
        } else {
          // 개발 환경: 메모리 캐시 사용
          return {
            ttl: 300,
            max: 1000,
            isGlobal: true,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}

