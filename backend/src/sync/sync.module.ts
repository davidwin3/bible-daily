import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { UserMission } from '../entities/user-mission.entity';
import { Mission } from '../entities/mission.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Like,
      UserMission,
      Mission,
      User,
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
