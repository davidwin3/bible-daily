import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MissionsModule } from './missions/missions.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { CellsModule } from './cells/cells.module';
import { AdminModule } from './admin/admin.module';
import { CacheModule } from './cache/cache.module';
import { NotificationsModule } from './notifications/notifications.module';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Mission } from './entities/mission.entity';
import { MissionScripture } from './entities/mission-scripture.entity';
import { UserMission } from './entities/user-mission.entity';
import { Cell } from './entities/cell.entity';
import { CellMember } from './entities/cell-member.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    CacheModule,
    AuthModule,
    UsersModule,
    PostsModule,
    MissionsModule,
    CellsModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
