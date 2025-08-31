import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  const dbConfig = {
    host: configService.get('DB_HOST'),
    port: parseInt(configService.get('DB_PORT') || '3306', 10),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
  };

  console.log('🔍 Database connection config:', {
    ...dbConfig,
    password: '***', // 비밀번호는 숨김
  });

  return {
    type: 'mysql',
    ...dbConfig,

    // 연결 풀 최적화
    extra: {
      // MySQL 특화 설정
      charset: 'utf8mb4',
      timezone: '+09:00', // 한국 시간대

      // 성능 최적화
      supportBigNumbers: true,
      bigNumberStrings: false,
      dateStrings: false,

      // SSL 설정 (운영 환경)
      ...(isProduction && {
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    },

    // 연결 풀 설정 (TypeORM 레벨에서 관리)
    poolSize: isProduction ? 20 : 10, // 최대 연결 수
    connectTimeout: 30000, // 연결 타임아웃 (30초)

    // 엔티티 설정
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],

    // 마이그레이션 설정
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: false, // 자동 마이그레이션 비활성화

    // 개발 환경에서만 동기화
    synchronize: !isProduction,

    // 로깅 설정
    logging: isProduction
      ? ['error', 'warn']
      : ['query', 'error', 'warn', 'info'],
    logger: 'advanced-console',

    // 연결 재시도 설정
    retryAttempts: 10,
    retryDelay: 3000,

    // 자동 엔티티 로드
    autoLoadEntities: true,

    // 캐시 설정 (일시적으로 비활성화)
    // cache: {
    //   type: 'redis',
    //   options: {
    //     host: configService.get('REDIS_HOST', 'localhost'),
    //     port: configService.get('REDIS_PORT', 6379),
    //     password: configService.get('REDIS_PASSWORD'),
    //     db: configService.get('REDIS_DB', 1), // 캐시용 DB
    //   },
    //   duration: 300000, // 5분 캐시
    // },

    // 성능 모니터링
    maxQueryExecutionTime: 1000, // 1초 이상 걸리는 쿼리 로깅
  };
};

// 읽기 전용 데이터베이스 설정 (마스터-슬레이브 구성 시)
export const getReadOnlyDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const baseConfig = getDatabaseConfig(configService);

  return {
    ...baseConfig,
    name: 'readonly',
    host: configService.get('DB_READ_HOST', configService.get('DB_HOST')),
    extra: {
      ...baseConfig.extra,
      connectionLimit: 30, // 읽기 전용은 더 많은 연결 허용
    },
  };
};
